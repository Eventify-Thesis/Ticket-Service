import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../shared/redis/redis.service';
import { CircuitBreakerService } from '../../shared/circuit-breaker/circuit-breaker.service';
import { MetricsService } from '../../shared/metrics/metrics.service';
import { Ticket, TicketDocument, TicketStatus } from '../entities/ticket.entity';
import { Reservation, ReservationDocument, ReservationStatus } from '../entities/reservation.entity';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);
  private readonly reservationTimeout: number;
  private readonly lockTTL = 30; // 30 seconds

  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    @InjectQueue('ticket-operations') private ticketQueue: Queue,
    private readonly redisService: RedisService,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    this.reservationTimeout = this.configService.get('ticket.reservationTimeoutSeconds');
  }

  private getTicketCacheKey(ticketId: string): string {
    return `ticket:${ticketId}:quantity`;
  }

  private getReservationCacheKey(reservationId: string): string {
    return `reservation:${reservationId}`;
  }

  async getAvailableTickets(eventId: string, showingId: string): Promise<Ticket[]> {
    const timer = this.metricsService.startTimer('ticket_query_duration');
    try {
      const cacheKey = `available-tickets:${eventId}:${showingId}`;
      const cachedData = await this.redisService.get(cacheKey);

      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const query = { eventId, showingId, status: TicketStatus.AVAILABLE, remainingQuantity: { $gt: 0 }, isActive: true };
      const tickets = await this.circuitBreaker.executeWithBreaker(
        'getAvailableTickets',
        () => this.ticketModel.find(query).exec(),
      );

      await this.redisService.set(cacheKey, JSON.stringify(tickets), 60); // Cache for 1 minute
      this.metricsService.incrementCounter('ticket_queries_total');
      return tickets;
    } catch (error) {
      this.metricsService.incrementCounter('ticket_query_errors_total');
      throw error;
    } finally {
      timer();
    }
  }

  async reserveTickets(
    ticketId: string,
    userId: string,
    quantity: number,
  ): Promise<string> {
    const timer = this.metricsService.startTimer('ticket_reservation_duration');
    const lockKey = `ticket-lock:${ticketId}`;

    try {
      // Try to acquire lock
      const locked = await this.redisService.setWithLock(
        lockKey,
        userId,
        this.lockTTL,
      );

      if (!locked) {
        throw new ConflictException('Tickets are currently being processed');
      }

      const session = await this.ticketModel.startSession();
      session.startTransaction();

      try {
        const ticket = await this.ticketModel.findOne({
          _id: ticketId,
          status: TicketStatus.AVAILABLE,
          isActive: true,
        }).session(session);

        if (!ticket) {
          throw new NotFoundException('Ticket not found or not available');
        }

        if (ticket.remainingQuantity < quantity) {
          throw new ConflictException('Not enough tickets available');
        }

        // Create reservation
        const reservation = await this.reservationModel.create([{
          ticketId,
          userId,
          quantity,
          status: ReservationStatus.PENDING,
          expiresAt: new Date(Date.now() + this.reservationTimeout * 1000),
        }], { session });

        // Update ticket quantity
        await this.ticketModel.updateOne(
          { _id: ticketId },
          { 
            $inc: { remainingQuantity: -quantity },
            $set: { 
              status: ticket.remainingQuantity === quantity 
                ? TicketStatus.RESERVED 
                : TicketStatus.AVAILABLE 
            }
          },
          { session },
        );

        // Add to cleanup queue
        await this.ticketQueue.add(
          'cleanup-reservation',
          { reservationId: reservation[0]._id },
          { delay: this.reservationTimeout * 1000 },
        );

        await session.commitTransaction();
        this.metricsService.incrementCounter('ticket_reservations_total');
        return reservation[0]._id.toString();
      } catch (error) {
        await session.abortTransaction();
        this.metricsService.incrementCounter('ticket_reservation_errors_total');
        throw error;
      } finally {
        session.endSession();
      }
    } finally {
      // Release lock
      await this.redisService.del(lockKey);
      timer();
    }
  }

  async confirmReservation(reservationId: string, userId: string): Promise<void> {
    const timer = this.metricsService.startTimer('ticket_confirmation_duration');
    try {
      const reservationKey = `reservation:${reservationId}`;
      const reservationData = await this.redisService.get(reservationKey);

      if (!reservationData) {
        throw new NotFoundException('Reservation not found or expired');
      }

      const reservation = JSON.parse(reservationData);
      if (reservation.userId !== userId) {
        throw new ConflictException('Invalid user for this reservation');
      }

      const session = await this.ticketModel.startSession();
      session.startTransaction();

      try {
        // Update reservation status
        await this.reservationModel.updateOne(
          { _id: reservationId },
          { status: ReservationStatus.CONFIRMED },
          { session },
        );

        // Update ticket status if all tickets are sold
        const ticket = await this.ticketModel.findById(reservation.ticketId).session(session);
        if (ticket && ticket.remainingQuantity === 0) {
          await this.ticketModel.updateOne(
            { _id: ticket._id },
            { status: TicketStatus.SOLD },
            { session },
          );
        }

        await session.commitTransaction();
        this.metricsService.incrementCounter('ticket_confirmations_total');
      } catch (error) {
        await session.abortTransaction();
        this.metricsService.incrementCounter('ticket_confirmation_errors_total');
        throw error;
      } finally {
        session.endSession();
      }
    } finally {
      timer();
    }
  }

  async cancelReservation(reservationId: string, userId: string): Promise<void> {
    const timer = this.metricsService.startTimer('ticket_cancellation_duration');
    try {
      const reservationKey = `reservation:${reservationId}`;
      const reservationData = await this.redisService.get(reservationKey);

      if (!reservationData) {
        throw new NotFoundException('Reservation not found or expired');
      }

      const reservation = JSON.parse(reservationData);
      if (reservation.userId !== userId) {
        throw new ConflictException('Invalid user for this reservation');
      }

      const session = await this.ticketModel.startSession();
      session.startTransaction();

      try {
        // Update reservation status
        await this.reservationModel.updateOne(
          { _id: reservationId },
          { status: ReservationStatus.CANCELLED },
          { session },
        );

        // Return tickets to available pool
        await this.ticketModel.updateOne(
          { _id: reservation.ticketId },
          { 
            $inc: { remainingQuantity: reservation.quantity },
            status: TicketStatus.AVAILABLE,
          },
          { session },
        );

        await session.commitTransaction();
        this.metricsService.incrementCounter('ticket_cancellations_total');
      } catch (error) {
        await session.abortTransaction();
        this.metricsService.incrementCounter('ticket_cancellation_errors_total');
        throw error;
      } finally {
        session.endSession();
      }
    } finally {
      timer();
    }
  }

  async cleanupExpiredReservations(): Promise<void> {
    const timer = this.metricsService.startTimer('ticket_cleanup_duration');
    try {
      const session = await this.ticketModel.startSession();
      session.startTransaction();

      try {
        const expiredReservations = await this.reservationModel.find({
          status: ReservationStatus.PENDING,
          expiresAt: { $lt: new Date() },
        }).session(session);

        for (const reservation of expiredReservations) {
          // Update reservation status
          await this.reservationModel.updateOne(
            { _id: reservation._id },
            { status: ReservationStatus.EXPIRED },
            { session },
          );

          // Return tickets to available pool
          await this.ticketModel.updateOne(
            { _id: reservation.ticketId },
            { 
              $inc: { remainingQuantity: reservation.quantity },
              status: TicketStatus.AVAILABLE,
            },
            { session },
          );
        }

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        this.logger.error('Error cleaning up expired reservations:', error);
      } finally {
        session.endSession();
      }
    } finally {
      timer();
    }
  }
}

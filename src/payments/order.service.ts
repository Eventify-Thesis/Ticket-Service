import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RedisService } from 'src/shared/redis/redis.service';
import { BookingAnswer } from 'src/bookings/entities/booking-answer.entity';
import { Attendee } from 'src/payments/entities/attendees.entity';
import { Seat, SeatStatus } from 'src/seat/entities/seat.entity';
import { getBookingAnswerKey, getBookingKey, getBookingCleanupKey, getSeatLockKey } from 'src/utils/getRedisKey';
import { Order, OrderStatus } from 'src/bookings/entities/order.entity';
import { TicketType } from 'src/seat/entities/ticket-type.entity';
import { EmailService } from 'src/email/email.service';
import { IdHelper } from 'src/common/helper/id-helper';
import { EventStatisticsService } from './event-statistics.service';

interface OrderPaymentData {
  paymentIntentId: string;
  paidAt: Date;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly eventStatisticsService: EventStatisticsService,
  ) { }

  async getOrder(orderId: number): Promise<Order> {
    try {
      const order = await this.orderRepository.findOneByOrFail({ id: orderId });
      this.logger.debug(`Retrieved order ${orderId}`);
      return order;
    } catch (error) {
      this.logger.error(`Failed to get order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  async saveOrder(order: Order): Promise<Order> {
    try {
      const savedOrder = await this.orderRepository.save(order);
      this.logger.debug(`Saved order ${order.id}`);
      return savedOrder;
    } catch (error) {
      this.logger.error(`Failed to save order ${order.id}: ${error.message}`);
      throw error;
    }
  }

  private async updateOrderPaymentStatus(
    order: Order,
    paymentData: OrderPaymentData
  ): Promise<void> {
    try {
      order.status = OrderStatus.PAID;
      order.paidAt = paymentData.paidAt;
      order.stripePaymentIntentId = paymentData.paymentIntentId;
      this.logger.debug(`Updated payment status for order ${order.id}`);
    } catch (error) {
      this.logger.error(`Failed to update payment status for order ${order.id}: ${error.message}`);
      throw error;
    }
  }

  private async handleSeatsAndTickets(
    manager: any,
    orderItems: any[]
  ): Promise<void> {
    try {
      this.logger.debug(`Processing ${orderItems.length} order items`);
      const updatePromises = orderItems.map(async (item) => {
        const promises = [];

        if (item.seatId) {
          this.logger.debug(`Unlocking seat ${item.seatId} for order item`);
          promises.push(
            this.redisService.del(getSeatLockKey(item.seatId)),
            manager.update(Seat, item.seatId, { status: SeatStatus.BOOKED })
          );
        }

        this.logger.debug(`Updating ticket type ${item.ticketTypeId} quantity`);
        promises.push(
          manager.increment(
            TicketType,
            { id: item.ticketTypeId },
            'soldQuantity',
            item.quantity
          )
        );

        await Promise.all(promises);
      });

      await Promise.all(updatePromises);
      this.logger.debug('Successfully processed seats and tickets');
    } catch (error) {
      this.logger.error(`Failed to process seats and tickets: ${error.message}`);
      throw error;
    }
  }

  private async processBookingAnswers(
    manager: any,
    order: Order,
    bookingAnswers: any
  ): Promise<void> {
    try {
      this.logger.debug(`Processing booking answers for order ${order.id}`);

      // Update order contact info
      order.firstName = bookingAnswers.order.first_name;
      order.lastName = bookingAnswers.order.last_name;
      order.email = bookingAnswers.order.email;

      // Process order-level questions
      const orderQuestions = bookingAnswers.order.questions.map(
        (question) => ({
          eventId: order.eventId,
          showId: order.showId,
          orderId: order.id,
          userId: order.userId,
          questionId: parseInt(question.question_id),
          answer: JSON.stringify(question.response?.answer),
        })
      );

      this.logger.debug(`Processing ${orderQuestions.length} order-level questions`);

      // Process attendee data and questions
      const attendees = await Promise.all(bookingAnswers.attendees.map(async (attendee: any) => {
        const attendeeEntity = await manager.save(Attendee, {
          eventId: order.eventId,
          showId: order.showId,
          orderId: order.id,
          ticketTypeId: attendee.id,
          firstName: attendee.first_name,
          lastName: attendee.last_name,
          email: attendee.email,
          publicId: IdHelper.publicId(IdHelper.ATTENDEE_PREFIX),
          shortId: IdHelper.shortId(IdHelper.ATTENDEE_PREFIX),
          status: 'ACTIVE'
        });

        return {
          attendeeEntity,
          originalAttendee: attendee
        };
      }));

      this.logger.debug(`Processing ${attendees.length} attendees`);

      const attendeeQuestions = attendees.flatMap(({ attendeeEntity, originalAttendee }) =>
        (originalAttendee.questions || []).map((question: any) => ({
          orderId: order.id,
          eventId: order.eventId,
          showId: order.showId,
          userId: order.userId,
          questionId: question.id,
          answer: JSON.stringify(question.response),
          attendeeId: attendeeEntity.id
        }))
      );

      this.logger.debug(`Processing ${attendeeQuestions.length} attendee questions`);

      // Save all entities
      await Promise.all([
        manager.save(BookingAnswer, [...orderQuestions, ...attendeeQuestions]),
        manager.save(order),
      ]);

      this.logger.debug('Successfully saved all booking answers and attendees');
    } catch (error) {
      this.logger.error(`Failed to process booking answers for order ${order.id}: ${error.message}`);
      throw error;
    }
  }

  private async cleanupRedisKeys(order: Order, bookingAnswerKey: string): Promise<void> {
    try {
      this.logger.debug(`Cleaning up Redis keys for order ${order.id}`);
      await Promise.all([
        this.redisService.del(getBookingKey(order.showId, order.bookingCode)),
        this.redisService.del(getBookingCleanupKey(order.showId, order.bookingCode)),
        this.redisService.del(bookingAnswerKey),
      ]);
      this.logger.debug('Successfully cleaned up Redis keys');
    } catch (error) {
      this.logger.error(`Failed to cleanup Redis keys for order ${order.id}: ${error.message}`);
      throw error;
    }
  }

  async completeOrderPayment(orderId: number, paymentData: OrderPaymentData): Promise<void> {
    this.logger.log(`Starting payment completion for order ${orderId}`);

    try {
      await this.dataSource.transaction(async (manager) => {
        // 1. Get order with items and attendees
        this.logger.debug(`Fetching order ${orderId} with items and attendees`);
        const order = await manager.findOneOrFail(Order, {
          where: { id: orderId },
          relations: ['items'],
        });

        // 2. Update order payment status
        this.logger.debug('Updating order payment status');
        await this.updateOrderPaymentStatus(order, paymentData);

        // 3. Handle seats and ticket quantities
        this.logger.debug('Processing seats and tickets');
        await this.handleSeatsAndTickets(manager, order.items);

        // 4. Process booking answers if they exist
        const bookingAnswerKey = getBookingAnswerKey(order.showId, order.bookingCode);
        const bookingAnswerStr = await this.redisService.get(bookingAnswerKey);

        if (bookingAnswerStr) {
          this.logger.debug('Found booking answers, processing them');
          const bookingAnswers = JSON.parse(bookingAnswerStr);
          await this.processBookingAnswers(manager, order, bookingAnswers);
        } else {
          this.logger.debug('No booking answers found to process');
        }

        //5. Get event info from raw query since Event entity is not available
        this.logger.debug('Fetching event details for confirmation email');
        const [eventInfo] = await manager.query(`
          SELECT 
            id,
            event_name as "eventName",
            event_description as "eventDescription",
            org_name as "orgName",
            org_description as "orgDescription",
            org_logo_url as "orgLogoUrl",
            event_logo_url as "eventLogoUrl",
            event_banner_url as "eventBannerUrl",
            venue_name as "venueName",
            street,
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM events 
          WHERE id = $1
        `, [order.eventId]);

        if (!eventInfo) {
          throw new Error(`Event not found for order ${orderId}`);
        }

        // 6. Increment event statistics
        await this.eventStatisticsService.updateStatistics(order, manager);

        this.logger.debug('Sending confirmation email');
        await this.emailService.sendConfirmation(order, eventInfo);


        // 7. Cleanup Redis keys
        this.logger.debug('Cleaning up Redis keys');
        await this.cleanupRedisKeys(order, bookingAnswerKey);

        this.logger.log(`Successfully completed payment for order ${orderId}`);
      });
    } catch (error) {
      this.logger.error(`Failed to complete payment for order ${orderId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}

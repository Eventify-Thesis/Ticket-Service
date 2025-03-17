import { Model } from 'mongoose';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../shared/redis/redis.service';
import { CircuitBreakerService } from '../../shared/circuit-breaker/circuit-breaker.service';
import { MetricsService } from '../../shared/metrics/metrics.service';
import { Ticket, TicketDocument } from '../entities/ticket.entity';
import { ReservationDocument } from '../entities/reservation.entity';
export declare class TicketService {
    private ticketModel;
    private reservationModel;
    private ticketQueue;
    private readonly redisService;
    private readonly circuitBreaker;
    private readonly configService;
    private readonly metricsService;
    private readonly logger;
    private readonly reservationTimeout;
    private readonly lockTTL;
    constructor(ticketModel: Model<TicketDocument>, reservationModel: Model<ReservationDocument>, ticketQueue: Queue, redisService: RedisService, circuitBreaker: CircuitBreakerService, configService: ConfigService, metricsService: MetricsService);
    private getTicketCacheKey;
    private getReservationCacheKey;
    getAvailableTickets(eventId: string, showingId: string): Promise<Ticket[]>;
    reserveTickets(ticketId: string, userId: string, quantity: number): Promise<string>;
    confirmReservation(reservationId: string, userId: string): Promise<void>;
    cancelReservation(reservationId: string, userId: string): Promise<void>;
    cleanupExpiredReservations(): Promise<void>;
}

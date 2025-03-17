"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TicketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
const redis_service_1 = require("../../shared/redis/redis.service");
const circuit_breaker_service_1 = require("../../shared/circuit-breaker/circuit-breaker.service");
const metrics_service_1 = require("../../shared/metrics/metrics.service");
const ticket_entity_1 = require("../entities/ticket.entity");
const reservation_entity_1 = require("../entities/reservation.entity");
let TicketService = TicketService_1 = class TicketService {
    constructor(ticketModel, reservationModel, ticketQueue, redisService, circuitBreaker, configService, metricsService) {
        this.ticketModel = ticketModel;
        this.reservationModel = reservationModel;
        this.ticketQueue = ticketQueue;
        this.redisService = redisService;
        this.circuitBreaker = circuitBreaker;
        this.configService = configService;
        this.metricsService = metricsService;
        this.logger = new common_1.Logger(TicketService_1.name);
        this.lockTTL = 30;
        this.reservationTimeout = this.configService.get('ticket.reservationTimeoutSeconds');
    }
    getTicketCacheKey(ticketId) {
        return `ticket:${ticketId}:quantity`;
    }
    getReservationCacheKey(reservationId) {
        return `reservation:${reservationId}`;
    }
    async getAvailableTickets(eventId, showingId) {
        const timer = this.metricsService.startTimer('ticket_query_duration');
        try {
            const cacheKey = `available-tickets:${eventId}:${showingId}`;
            const cachedData = await this.redisService.get(cacheKey);
            if (cachedData) {
                return JSON.parse(cachedData);
            }
            const query = { eventId, showingId, status: ticket_entity_1.TicketStatus.AVAILABLE, remainingQuantity: { $gt: 0 }, isActive: true };
            const tickets = await this.circuitBreaker.executeWithBreaker('getAvailableTickets', () => this.ticketModel.find(query).exec());
            await this.redisService.set(cacheKey, JSON.stringify(tickets), 60);
            this.metricsService.incrementCounter('ticket_queries_total');
            return tickets;
        }
        catch (error) {
            this.metricsService.incrementCounter('ticket_query_errors_total');
            throw error;
        }
        finally {
            timer();
        }
    }
    async reserveTickets(ticketId, userId, quantity) {
        const timer = this.metricsService.startTimer('ticket_reservation_duration');
        const lockKey = `ticket-lock:${ticketId}`;
        try {
            const locked = await this.redisService.setWithLock(lockKey, userId, this.lockTTL);
            if (!locked) {
                throw new common_1.ConflictException('Tickets are currently being processed');
            }
            const session = await this.ticketModel.startSession();
            session.startTransaction();
            try {
                const ticket = await this.ticketModel.findOne({
                    _id: ticketId,
                    status: ticket_entity_1.TicketStatus.AVAILABLE,
                    isActive: true,
                }).session(session);
                if (!ticket) {
                    throw new common_1.NotFoundException('Ticket not found or not available');
                }
                if (ticket.remainingQuantity < quantity) {
                    throw new common_1.ConflictException('Not enough tickets available');
                }
                const reservation = await this.reservationModel.create([{
                        ticketId,
                        userId,
                        quantity,
                        status: reservation_entity_1.ReservationStatus.PENDING,
                        expiresAt: new Date(Date.now() + this.reservationTimeout * 1000),
                    }], { session });
                await this.ticketModel.updateOne({ _id: ticketId }, {
                    $inc: { remainingQuantity: -quantity },
                    $set: {
                        status: ticket.remainingQuantity === quantity
                            ? ticket_entity_1.TicketStatus.RESERVED
                            : ticket_entity_1.TicketStatus.AVAILABLE
                    }
                }, { session });
                await this.ticketQueue.add('cleanup-reservation', { reservationId: reservation[0]._id }, { delay: this.reservationTimeout * 1000 });
                await session.commitTransaction();
                this.metricsService.incrementCounter('ticket_reservations_total');
                return reservation[0]._id.toString();
            }
            catch (error) {
                await session.abortTransaction();
                this.metricsService.incrementCounter('ticket_reservation_errors_total');
                throw error;
            }
            finally {
                session.endSession();
            }
        }
        finally {
            await this.redisService.del(lockKey);
            timer();
        }
    }
    async confirmReservation(reservationId, userId) {
        const timer = this.metricsService.startTimer('ticket_confirmation_duration');
        try {
            const reservationKey = `reservation:${reservationId}`;
            const reservationData = await this.redisService.get(reservationKey);
            if (!reservationData) {
                throw new common_1.NotFoundException('Reservation not found or expired');
            }
            const reservation = JSON.parse(reservationData);
            if (reservation.userId !== userId) {
                throw new common_1.ConflictException('Invalid user for this reservation');
            }
            const session = await this.ticketModel.startSession();
            session.startTransaction();
            try {
                await this.reservationModel.updateOne({ _id: reservationId }, { status: reservation_entity_1.ReservationStatus.CONFIRMED }, { session });
                const ticket = await this.ticketModel.findById(reservation.ticketId).session(session);
                if (ticket && ticket.remainingQuantity === 0) {
                    await this.ticketModel.updateOne({ _id: ticket._id }, { status: ticket_entity_1.TicketStatus.SOLD }, { session });
                }
                await session.commitTransaction();
                this.metricsService.incrementCounter('ticket_confirmations_total');
            }
            catch (error) {
                await session.abortTransaction();
                this.metricsService.incrementCounter('ticket_confirmation_errors_total');
                throw error;
            }
            finally {
                session.endSession();
            }
        }
        finally {
            timer();
        }
    }
    async cancelReservation(reservationId, userId) {
        const timer = this.metricsService.startTimer('ticket_cancellation_duration');
        try {
            const reservationKey = `reservation:${reservationId}`;
            const reservationData = await this.redisService.get(reservationKey);
            if (!reservationData) {
                throw new common_1.NotFoundException('Reservation not found or expired');
            }
            const reservation = JSON.parse(reservationData);
            if (reservation.userId !== userId) {
                throw new common_1.ConflictException('Invalid user for this reservation');
            }
            const session = await this.ticketModel.startSession();
            session.startTransaction();
            try {
                await this.reservationModel.updateOne({ _id: reservationId }, { status: reservation_entity_1.ReservationStatus.CANCELLED }, { session });
                await this.ticketModel.updateOne({ _id: reservation.ticketId }, {
                    $inc: { remainingQuantity: reservation.quantity },
                    status: ticket_entity_1.TicketStatus.AVAILABLE,
                }, { session });
                await session.commitTransaction();
                this.metricsService.incrementCounter('ticket_cancellations_total');
            }
            catch (error) {
                await session.abortTransaction();
                this.metricsService.incrementCounter('ticket_cancellation_errors_total');
                throw error;
            }
            finally {
                session.endSession();
            }
        }
        finally {
            timer();
        }
    }
    async cleanupExpiredReservations() {
        const timer = this.metricsService.startTimer('ticket_cleanup_duration');
        try {
            const session = await this.ticketModel.startSession();
            session.startTransaction();
            try {
                const expiredReservations = await this.reservationModel.find({
                    status: reservation_entity_1.ReservationStatus.PENDING,
                    expiresAt: { $lt: new Date() },
                }).session(session);
                for (const reservation of expiredReservations) {
                    await this.reservationModel.updateOne({ _id: reservation._id }, { status: reservation_entity_1.ReservationStatus.EXPIRED }, { session });
                    await this.ticketModel.updateOne({ _id: reservation.ticketId }, {
                        $inc: { remainingQuantity: reservation.quantity },
                        status: ticket_entity_1.TicketStatus.AVAILABLE,
                    }, { session });
                }
                await session.commitTransaction();
            }
            catch (error) {
                await session.abortTransaction();
                this.logger.error('Error cleaning up expired reservations:', error);
            }
            finally {
                session.endSession();
            }
        }
        finally {
            timer();
        }
    }
};
exports.TicketService = TicketService;
exports.TicketService = TicketService = TicketService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(ticket_entity_1.Ticket.name)),
    __param(1, (0, mongoose_1.InjectModel)(reservation_entity_1.Reservation.name)),
    __param(2, (0, bull_1.InjectQueue)('ticket-operations')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model, Object, redis_service_1.RedisService,
        circuit_breaker_service_1.CircuitBreakerService,
        config_1.ConfigService,
        metrics_service_1.MetricsService])
], TicketService);
//# sourceMappingURL=ticket.service.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
const ticket_service_1 = require("../services/ticket.service");
const redis_service_1 = require("../../shared/redis/redis.service");
const circuit_breaker_service_1 = require("../../shared/circuit-breaker/circuit-breaker.service");
const ticket_entity_1 = require("../entities/ticket.entity");
const reservation_entity_1 = require("../entities/reservation.entity");
const metrics_service_1 = require("../../shared/metrics/metrics.service");
describe("TicketService", () => {
    let service;
    let ticketModel;
    let reservationModel;
    let redisService;
    let circuitBreaker;
    const mockTicket = {
        _id: "ticket123",
        eventId: "event123",
        showingId: "showing123",
        status: ticket_entity_1.TicketStatus.AVAILABLE,
        price: 100,
        quantity: 10,
        remainingQuantity: 10,
        isActive: true,
    };
    const mockReservation = {
        _id: "reservation123",
        ticketId: "ticket123",
        userId: "user123",
        quantity: 2,
        status: reservation_entity_1.ReservationStatus.PENDING,
        expiresAt: new Date(Date.now() + 900000),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                ticket_service_1.TicketService,
                {
                    provide: (0, mongoose_1.getModelToken)(ticket_entity_1.Ticket.name),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        findById: jest.fn(),
                        create: jest.fn(),
                        updateOne: jest.fn(),
                        startSession: jest.fn(() => ({
                            startTransaction: jest.fn(),
                            commitTransaction: jest.fn(),
                            abortTransaction: jest.fn(),
                            endSession: jest.fn(),
                        })),
                    },
                },
                {
                    provide: (0, mongoose_1.getModelToken)(reservation_entity_1.Reservation.name),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        updateOne: jest.fn(),
                    },
                },
                {
                    provide: (0, bull_1.getQueueToken)("ticket-operations"),
                    useValue: {
                        add: jest.fn(),
                    },
                },
                {
                    provide: redis_service_1.RedisService,
                    useValue: {
                        get: jest.fn(),
                        set: jest.fn(),
                        acquireLock: jest.fn(),
                        releaseLock: jest.fn(),
                    },
                },
                {
                    provide: circuit_breaker_service_1.CircuitBreakerService,
                    useValue: {
                        execute: jest.fn((fn) => fn()),
                    },
                },
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue(900),
                    },
                },
                {
                    provide: metrics_service_1.MetricsService,
                    useValue: {
                        startReservationTimer: jest.fn(),
                        incrementReservation: jest.fn(),
                        incrementConfirmation: jest.fn(),
                        recordCacheHit: jest.fn(),
                        recordCacheMiss: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(ticket_service_1.TicketService);
        ticketModel = module.get((0, mongoose_1.getModelToken)(ticket_entity_1.Ticket.name));
        reservationModel = module.get((0, mongoose_1.getModelToken)(reservation_entity_1.Reservation.name));
        redisService = module.get(redis_service_1.RedisService);
        circuitBreaker = module.get(circuit_breaker_service_1.CircuitBreakerService);
    });
    describe("getAvailableTickets", () => {
        it("should return available tickets from cache if exists", async () => {
            const cachedTickets = [mockTicket];
            jest
                .spyOn(redisService, "get")
                .mockResolvedValue(JSON.stringify(cachedTickets));
            const result = await service.getAvailableTickets("event123", "showing123");
            expect(result).toEqual(cachedTickets);
            expect(redisService.get).toHaveBeenCalled();
        });
        it("should fetch from database and cache if not in cache", async () => {
            jest.spyOn(redisService, "get").mockResolvedValue(null);
            jest.spyOn(ticketModel, "find").mockResolvedValue([mockTicket]);
            jest.spyOn(redisService, "set").mockResolvedValue("OK");
            const result = await service.getAvailableTickets("event123", "showing123");
            expect(result).toEqual([mockTicket]);
            expect(ticketModel.find).toHaveBeenCalled();
            expect(redisService.set).toHaveBeenCalled();
        });
    });
    describe("reserveTickets", () => {
        it("should successfully reserve tickets", async () => {
            jest.spyOn(redisService, "acquireLock").mockResolvedValue("lockToken");
            jest.spyOn(ticketModel, "findOne").mockResolvedValue(mockTicket);
            jest
                .spyOn(reservationModel, "create")
                .mockResolvedValue([mockReservation]);
            const result = await service.reserveTickets("ticket123", "user123", 2);
            expect(result).toBe("reservation123");
            expect(redisService.acquireLock).toHaveBeenCalled();
            expect(ticketModel.findOne).toHaveBeenCalled();
            expect(reservationModel.create).toHaveBeenCalled();
        });
        it("should throw error if tickets not available", async () => {
            const unavailableTicket = { ...mockTicket, remainingQuantity: 1 };
            jest.spyOn(redisService, "acquireLock").mockResolvedValue("lockToken");
            jest.spyOn(ticketModel, "findOne").mockResolvedValue(unavailableTicket);
            await expect(service.reserveTickets("ticket123", "user123", 2)).rejects.toThrow("Not enough tickets available");
        });
    });
});
//# sourceMappingURL=ticket.service.spec.js.map
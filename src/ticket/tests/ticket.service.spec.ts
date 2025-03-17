import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { getQueueToken } from "@nestjs/bull";
import { ConfigService } from "@nestjs/config";
import { Model } from "mongoose";
import { TicketService } from "../services/ticket.service";
import { RedisService } from "../../shared/redis/redis.service";
import { CircuitBreakerService } from "../../shared/circuit-breaker/circuit-breaker.service";
import { Ticket, TicketStatus } from "../entities/ticket.entity";
import { Reservation, ReservationStatus } from "../entities/reservation.entity";
import { MetricsService } from "../../shared/metrics/metrics.service";

describe("TicketService", () => {
  let service: TicketService;
  let ticketModel: Model<Ticket>;
  let reservationModel: Model<Reservation>;
  let redisService: RedisService;
  let circuitBreaker: CircuitBreakerService;

  const mockTicket = {
    _id: "ticket123",
    eventId: "event123",
    showingId: "showing123",
    status: TicketStatus.AVAILABLE,
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
    status: ReservationStatus.PENDING,
    expiresAt: new Date(Date.now() + 900000),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        {
          provide: getModelToken(Ticket.name),
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
          provide: getModelToken(Reservation.name),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            updateOne: jest.fn(),
          },
        },
        {
          provide: getQueueToken("ticket-operations"),
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            acquireLock: jest.fn(),
            releaseLock: jest.fn(),
          },
        },
        {
          provide: CircuitBreakerService,
          useValue: {
            execute: jest.fn((fn) => fn()),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(900),
          },
        },
        {
          provide: MetricsService,
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

    service = module.get<TicketService>(TicketService);
    ticketModel = module.get<Model<Ticket>>(getModelToken(Ticket.name));
    reservationModel = module.get<Model<Reservation>>(
      getModelToken(Reservation.name)
    );
    redisService = module.get<RedisService>(RedisService);
    circuitBreaker = module.get<CircuitBreakerService>(CircuitBreakerService);
  });

  describe("getAvailableTickets", () => {
    it("should return available tickets from cache if exists", async () => {
      const cachedTickets = [mockTicket];
      jest
        .spyOn(redisService, "get")
        .mockResolvedValue(JSON.stringify(cachedTickets));

      const result = await service.getAvailableTickets(
        "event123",
        "showing123"
      );

      expect(result).toEqual(cachedTickets);
      expect(redisService.get).toHaveBeenCalled();
    });

    it("should fetch from database and cache if not in cache", async () => {
      jest.spyOn(redisService, "get").mockResolvedValue(null);
      jest.spyOn(ticketModel, "find").mockResolvedValue([mockTicket]);
      jest.spyOn(redisService, "set").mockResolvedValue("OK");

      const result = await service.getAvailableTickets(
        "event123",
        "showing123"
      );

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

      await expect(
        service.reserveTickets("ticket123", "user123", 2)
      ).rejects.toThrow("Not enough tickets available");
    });
  });

  // Add more test cases for other methods...
});

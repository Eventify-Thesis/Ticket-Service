import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Seat, SeatStatus } from "./entities/seat.entity";
import { RedisService } from "../shared/redis/redis.service";
import { TicketType } from "./entities/ticket-type.entity";
import { SeatCategoryMapping } from "./entities/seat-category-mapping.entity";
import { ClientProxy } from "@nestjs/microservices";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class SeatService {
  private readonly logger = new Logger(SeatService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly LOCK_TTL = 300; // 5 minutes
  private readonly SEAT_INFO_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    @InjectRepository(TicketType)
    private readonly ticketTypeRepository: Repository<TicketType>,
    @InjectRepository(SeatCategoryMapping)
    private readonly seatCategoryMappingRepository: Repository<SeatCategoryMapping>,
    private readonly redisService: RedisService,
    @Inject('GATEWAY_SERVICE') private gatewayClient: ClientProxy,
  ) { }

  private getShowSeatsCacheKey(showId: number): string {
    return `seats:show:${showId}:availability`;
  }

  private getSeatLockKey(seatId: string): string {
    return `seat:lock:${seatId}`;
  }

  private getSeatInfoKey(seatId: string): string {
    return `seat:info:${seatId}`;
  }

  async getShowSeatAvailability(showId: number) {
    const cacheKey = this.getShowSeatsCacheKey(showId);

    try {
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (err) {
      this.logger.warn(`Redis error (get): ${err.message}`);
    }

    const seats = await this.seatRepository.find({
      where: { showId, status: SeatStatus.AVAILABLE },
      select: ["id", "rowLabel", "seatNumber"],
    });

    console.log('seats, ', seats)

    for (const seat of seats) {
      const seatInfoKey = this.getSeatInfoKey(seat.id);
      await this.redisService.set(seatInfoKey, JSON.stringify(seat), this.SEAT_INFO_TTL);
    }

    const ticketTypes = await this.ticketTypeRepository.find({
      where: { showId },
    });

    const seatCategoryMappings = await this.seatCategoryMappingRepository.find({
      where: { showId },
    });

    const mappedTicketTypes = ticketTypes.map((type) => {
      const mappings = seatCategoryMappings.filter(
        (mapping) => mapping.ticketTypeId === type.id
      );

      return {
        ...type,
        categories: mappings.map((mapping) => mapping.category),
      };
    });

    const result = {
      available_seats: seats,
      ticket_types: mappedTicketTypes,
    };

    try {
      await this.redisService.set(
        cacheKey,
        JSON.stringify(result),
        this.CACHE_TTL
      );
    } catch (err) {
      this.logger.warn(`Failed to cache seat data: ${err.message}`);
    }

    return seats;
  }

  async invalidateShowSeatsCache(showId: number) {
    const cacheKey = this.getShowSeatsCacheKey(showId);
    await this.redisService.del(cacheKey);
    this.logger.log(`Invalidated cache for show ${showId}`);
  }

  async updateShowSeatAvailabilityCache(showId: number, seatsToRemove: string[]) {
    const cacheKey = this.getShowSeatsCacheKey(showId);

    try {
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        const data = JSON.parse(cachedData);
        data.available_seats = data.available_seats.filter(
          (seat) => !seatsToRemove.includes(seat.id)
        );
        await this.redisService.set(
          cacheKey,
          JSON.stringify(data),
          this.CACHE_TTL
        );

        this.gatewayClient.emit('seatUpdated', {
          showId,
          payload: JSON.stringify(data)
        });

        this.logger.log(`Updated seat availability cache for show ${showId}`);
      }
    } catch (err) {
      this.logger.warn(`Redis error (update): ${err.message}`);
    }
  }

  async addSeatsToAvailabilityCache(showId: number, seatsToAdd: { id: string, sectionId: string }[]) {
    const cacheKey = this.getShowSeatsCacheKey(showId);

    try {
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        const data = JSON.parse(cachedData);

        // Add seats back to available_seats, avoiding duplicates
        const existingSeatIds = new Set(data.available_seats.map(seat => seat.id));
        const newSeats = seatsToAdd.filter(seat => !existingSeatIds.has(seat.id));

        data.available_seats = [...data.available_seats, ...newSeats];

        await this.redisService.set(
          cacheKey,
          JSON.stringify(data),
          this.CACHE_TTL
        );

        this.gatewayClient.emit('seatUpdated', {
          showId,
          payload: JSON.stringify(data)
        });

        this.logger.log(`Added seats back to availability cache for show ${showId}`);
      }
    } catch (err) {
      this.logger.warn(`Redis error (add seats): ${err.message}`);
    }
  }

  async reserveSeatsWithRedis(
    seatIds: string[],
    showId: number,
    userId: string
  ): Promise<{
    reserved: string[];
    alreadyLocked: string[];
  }> {
    const reserved: string[] = [];
    const alreadyLocked: string[] = [];

    for (const seatId of seatIds) {
      const lockKey = this.getSeatLockKey(seatId);
      const existingLock = await this.redisService.get(lockKey);

      if (existingLock && existingLock !== userId) {
        alreadyLocked.push(seatId);
        continue;
      }

      // Try to set lock (NX = only if not exists, EX = TTL in seconds)
      const success = await this.redisService.setIfNotExists(
        lockKey,
        userId,
        this.LOCK_TTL
      );

      if (success) {
        reserved.push(seatId);
      } else {
        alreadyLocked.push(seatId);
      }
    }

    // If any seats were reserved, invalidate cache
    if (reserved.length > 0) {
      await this.invalidateShowSeatsCache(showId);
    }

    return { reserved, alreadyLocked };
  }

  async releaseSeatLocks(seatIds: string[], userId: string) {
    for (const seatId of seatIds) {
      const lockKey = this.getSeatLockKey(seatId);
      const currentLock = await this.redisService.get(lockKey);
      if (currentLock === userId) {
        await this.redisService.del(lockKey);
      }
    }
  }

  @OnEvent('booking.expired')
  async handleBookingExpired(payload: { showId: number; seats: { id: string; sectionId: string }[] }) {
    console.log('booking expired', payload);
    await this.addSeatsToAvailabilityCache(payload.showId, payload.seats);
  }
}

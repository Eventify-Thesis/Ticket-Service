import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Seat, SeatStatus } from "./entities/seat.entity";
import { RedisService } from "../shared/redis/redis.service";
import { Logger } from "@nestjs/common";
import { TicketType } from "./entities/ticket-type.entity";
import { SeatCategoryMapping } from "./entities/seat-category-mapping.entity";

@Injectable()
export class SeatService {
  private readonly logger = new Logger(SeatService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly LOCK_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    @InjectRepository(SeatCategoryMapping)
    private readonly seatCategoryMappingRepository: Repository<SeatCategoryMapping>,
    @InjectRepository(TicketType)
    private readonly ticketTypeRepository: Repository<TicketType>,

    private readonly redisService: RedisService
  ) {}

  private getShowSeatsCacheKey(showId: string): string {
    return `seats:show:${showId}:availability`;
  }

  private getSeatLockKey(seatId: string): string {
    return `seat:lock:${seatId}`;
  }

  async getShowSeatAvailability(showId: string) {
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
      select: ["id"],
    });

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

  async invalidateShowSeatsCache(showId: string) {
    const cacheKey = this.getShowSeatsCacheKey(showId);
    await this.redisService.del(cacheKey);
    this.logger.log(`Invalidated cache for show ${showId}`);
  }

  async reserveSeatsWithRedis(
    seatIds: string[],
    showId: string,
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
}

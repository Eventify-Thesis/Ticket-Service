import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Seat } from "./entities/seat.entity";
import { RedisService } from "../shared/redis/redis.service";
import { Logger } from "@nestjs/common";

@Injectable()
export class SeatService {
  private readonly logger = new Logger(SeatService.name);
  private readonly CACHE_TTL = 300; // 5 minutes cache

  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    private readonly redisService: RedisService
  ) {}

  private getShowSeatsCacheKey(showId: string): string {
    return `seats:show:${showId}:availability`;
  }

  async getShowSeatAvailability(showId: string) {
    const cacheKey = this.getShowSeatsCacheKey(showId);

    // Try to get from cache first
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // If not in cache, fetch from database
    const seats = await this.seatRepository.find({
      where: { showId },
      select: ["id", "seatingPlanId", "zoneId", "rowLabel", "status"],
    });

    // Cache the results
    await this.redisService.set(
      cacheKey,
      JSON.stringify(seats),
      this.CACHE_TTL
    );

    return seats;
  }

  async invalidateShowSeatsCache(showId: string) {
    const cacheKey = this.getShowSeatsCacheKey(showId);
    await this.redisService.del(cacheKey);
    this.logger.log(`Invalidated cache for show ${showId}`);
  }
}

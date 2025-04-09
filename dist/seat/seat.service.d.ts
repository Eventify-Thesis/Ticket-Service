import { Repository } from "typeorm";
import { Seat } from "./entities/seat.entity";
import { RedisService } from "../shared/redis/redis.service";
export declare class SeatService {
    private readonly seatRepository;
    private readonly redisService;
    private readonly logger;
    private readonly CACHE_TTL;
    constructor(seatRepository: Repository<Seat>, redisService: RedisService);
    private getShowSeatsCacheKey;
    getShowSeatAvailability(showId: string): Promise<any>;
    invalidateShowSeatsCache(showId: string): Promise<void>;
}

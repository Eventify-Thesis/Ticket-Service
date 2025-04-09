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
var SeatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const seat_entity_1 = require("./entities/seat.entity");
const redis_service_1 = require("../shared/redis/redis.service");
const common_2 = require("@nestjs/common");
let SeatService = SeatService_1 = class SeatService {
    constructor(seatRepository, redisService) {
        this.seatRepository = seatRepository;
        this.redisService = redisService;
        this.logger = new common_2.Logger(SeatService_1.name);
        this.CACHE_TTL = 300;
    }
    getShowSeatsCacheKey(showId) {
        return `seats:show:${showId}:availability`;
    }
    async getShowSeatAvailability(showId) {
        const cacheKey = this.getShowSeatsCacheKey(showId);
        const cachedData = await this.redisService.get(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        const seats = await this.seatRepository.find({
            where: { showId },
            select: ["id", "seatingPlanId", "zoneId", "rowLabel", "status"],
        });
        await this.redisService.set(cacheKey, JSON.stringify(seats), this.CACHE_TTL);
        return seats;
    }
    async invalidateShowSeatsCache(showId) {
        const cacheKey = this.getShowSeatsCacheKey(showId);
        await this.redisService.del(cacheKey);
        this.logger.log(`Invalidated cache for show ${showId}`);
    }
};
exports.SeatService = SeatService;
exports.SeatService = SeatService = SeatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(seat_entity_1.Seat)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        redis_service_1.RedisService])
], SeatService);
//# sourceMappingURL=seat.service.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.client = new ioredis_1.default({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            retryStrategy: (times) => Math.min(times * 50, 2000),
        });
        this.client.on('error', (error) => {
            console.error('Redis Client Error:', error);
        });
        this.client.on('connect', () => {
            console.log('Successfully connected to Redis');
        });
    }
    async onModuleDestroy() {
        await this.client.quit();
    }
    getClient() {
        return this.client;
    }
    async set(key, value, ttl) {
        if (ttl) {
            return this.client.set(key, value, 'EX', ttl);
        }
        return this.client.set(key, value);
    }
    async get(key) {
        try {
            return await this.client.get(key);
        }
        catch (error) {
            console.error(`Error getting key ${key}:`, error);
            throw error;
        }
    }
    async del(key) {
        try {
            return await this.client.del(key);
        }
        catch (error) {
            console.error(`Error deleting key ${key}:`, error);
            throw error;
        }
    }
    async exists(key) {
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            console.error(`Error checking existence of key ${key}:`, error);
            throw error;
        }
    }
    async expire(key, seconds) {
        try {
            return await this.client.expire(key, seconds);
        }
        catch (error) {
            console.error(`Error setting expiration for key ${key}:`, error);
            throw error;
        }
    }
    async ttl(key) {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            console.error(`Error getting TTL for key ${key}:`, error);
            throw error;
        }
    }
    async incr(key) {
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            console.error(`Error incrementing key ${key}:`, error);
            throw error;
        }
    }
    async decr(key) {
        try {
            return await this.client.decr(key);
        }
        catch (error) {
            console.error(`Error decrementing key ${key}:`, error);
            throw error;
        }
    }
    async hset(key, field, value) {
        try {
            return await this.client.hset(key, field, value);
        }
        catch (error) {
            console.error(`Error setting hash field ${field} for key ${key}:`, error);
            throw error;
        }
    }
    async hget(key, field) {
        try {
            return await this.client.hget(key, field);
        }
        catch (error) {
            console.error(`Error getting hash field ${field} for key ${key}:`, error);
            throw error;
        }
    }
    async hdel(key, field) {
        try {
            return await this.client.hdel(key, field);
        }
        catch (error) {
            console.error(`Error deleting hash field ${field} for key ${key}:`, error);
            throw error;
        }
    }
    async hgetall(key) {
        try {
            return await this.client.hgetall(key);
        }
        catch (error) {
            console.error(`Error getting all hash fields for key ${key}:`, error);
            throw error;
        }
    }
    async setWithLock(key, value, ttl) {
        try {
            const result = await this.client.set(key, value, 'EX', ttl, 'NX');
            return result === 'OK';
        }
        catch (error) {
            console.error(`Error setting key ${key} with lock:`, error);
            throw error;
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map
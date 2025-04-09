import { OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
export declare class RedisService implements OnModuleDestroy {
    private readonly configService;
    private readonly client;
    constructor(configService: ConfigService);
    onModuleDestroy(): Promise<void>;
    getClient(): Redis;
    set(key: string, value: string, ttl?: number): Promise<"OK">;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    incr(key: string): Promise<number>;
    decr(key: string): Promise<number>;
    hset(key: string, field: string, value: string): Promise<number>;
    hget(key: string, field: string): Promise<string | null>;
    hdel(key: string, field: string): Promise<number>;
    hgetall(key: string): Promise<Record<string, string>>;
    setWithLock(key: string, value: string, ttl: number): Promise<boolean>;
}

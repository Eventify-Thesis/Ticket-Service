import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>("REDIS_HOST", "172.17.0.1"), // Default Docker bridge network IP
      port: this.configService.get<number>("REDIS_PORT", 6379),
      connectTimeout: 10000,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Retrying Redis connection in ${delay}ms...`);
        return delay;
      },
    });

    this.client.on("error", (error) => {
      console.error("Redis Client Error:", error);
    });

    this.client.on("connect", () => {
      console.log("Successfully connected to Redis");
    });

    this.client.on("ready", () => {
      console.log("Redis client ready and connected");
    });

    this.client.on("close", () => {
      console.log("Redis connection closed");
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  async set(key: string, value: string, ttl?: number): Promise<"OK"> {
    if (ttl) {
      return this.client.set(key, value, "EX", ttl);
    }
    return this.client.set(key, value);
  }
  async setIfNotExists(
    key: string,
    value: string,
    ttlSeconds: number
  ): Promise<boolean> {
    const result = await this.client.set(key, value, "EX", ttlSeconds, "NX");
    return result === "OK";
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error(`Error getting key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      console.error(`Error deleting key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.error(`Error checking existence of key ${key}:`, error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      console.error(`Error setting expiration for key ${key}:`, error);
      throw error;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`Error getting TTL for key ${key}:`, error);
      throw error;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error(`Error incrementing key ${key}:`, error);
      throw error;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      return await this.client.decr(key);
    } catch (error) {
      console.error(`Error decrementing key ${key}:`, error);
      throw error;
    }
  }

  async incrBy(key: string, value: number): Promise<number> {
    try {
      return await this.client.incrby(key, value);
    } catch (error) {
      console.error(
        `Error incrementing by value ${value} for key ${key}:`,
        error
      );
      throw error;
    }
  }

  async decrBy(key: string, value: number): Promise<number> {
    try {
      return await this.client.decrby(key, value);
    } catch (error) {
      console.error(
        `Error decrementing by value ${value} for key ${key}:`,
        error
      );
      throw error;
    }
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hset(key, field, value);
    } catch (error) {
      console.error(`Error setting hash field ${field} for key ${key}:`, error);
      throw error;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      console.error(`Error getting hash field ${field} for key ${key}:`, error);
      throw error;
    }
  }

  async hdel(key: string, field: string): Promise<number> {
    try {
      return await this.client.hdel(key, field);
    } catch (error) {
      console.error(
        `Error deleting hash field ${field} for key ${key}:`,
        error
      );
      throw error;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      console.error(`Error getting all hash fields for key ${key}:`, error);
      throw error;
    }
  }

  async setWithLock(key: string, value: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.set(key, value, "EX", ttl, "NX");
      return result === "OK";
    } catch (error) {
      console.error(`Error setting key ${key} with lock:`, error);
      throw error;
    }
  }
}

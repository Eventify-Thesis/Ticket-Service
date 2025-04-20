import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: Redis;
  private subscriber: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.logger.log("🔸 RedisService constructor");
    const host = this.configService.get<string>("REDIS_HOST", "localhost");
    const port = this.configService.get<number>("REDIS_PORT", 6379);
    this.logger.log(`→ Client connecting to Redis @ ${host}:${port}`);

    this.client = new Redis({ host, port });
    this.client.on("error", err => this.logger.error("Client Error:", err));
    this.client.on("connect", () => this.logger.log("Client CONNECTED"));
    this.client.on("ready", () => this.logger.log("Client READY"));
    this.client.on("close", () => this.logger.log("Client CLOSED"));
  }

  async onModuleInit() {
    this.logger.log("onModuleInit()");

    const host = this.configService.get<string>("REDIS_HOST", "localhost");
    const port = this.configService.get<number>("REDIS_PORT", 6379);
    this.logger.log(`Subscriber connecting to Redis @ ${host}:${port}`);

    this.subscriber = new Redis({ host, port });
    this.subscriber.on("error", err => this.logger.error("Subscriber Error:", err));
    this.subscriber.on("connect", () => this.logger.log("Subscriber CONNECTED"));

    await new Promise<void>(resolve => {
      this.subscriber.once("ready", () => {
        this.logger.log("Subscriber READY");
        resolve();
      });
    });

    // Turn on expired‑key notifications
    const setReply = await this.subscriber.config(
      "SET",
      "notify-keyspace-events",
      "Ex"
    );
    this.logger.log("CONFIG SET notify-keyspace-events", setReply);

    const getReply = await this.subscriber.config(
      "GET",
      "notify-keyspace-events"
    );
    this.logger.log(
      "CONFIG GET notify-keyspace-events",
      getReply[1]
    );

    // Subscribe to expired events on DB 0
    const channel = "__keyevent@0__:expired";
    await this.subscriber.subscribe(channel);
    this.logger.log(`SUBSCRIBED to ${channel}`);

    // Handle every expiration
    this.subscriber.on(
      "message",
      async (chan: string, key: string) => {
        this.logger.log(`message: channel=${chan}  key=${key}`);

        if (!key.startsWith("booking:cleanup:")) return;

        this.logger.log(`booking:cleanup expired → ${key}`);
        try {
          const [, , showId, bookingCode] = key.split(":");
          const dataKey = `booking:${showId}:${bookingCode}`;
          const raw = await this.client.get(dataKey);
          if (!raw) {
            this.logger.warn(`No data at ${dataKey}`);
            return;
          }
          const { items } = JSON.parse(raw);
          const seats = items
            .filter(item => item.seatId)
            .map(item => item.seatId);
          for (const item of items) {
            const { id, quantity } = item;
            const tk = `ticket-type:lock:${id}`;
            await this.client.incrby(tk, quantity);
            this.logger.log(`Restored ${quantity} to ${tk}`);
          }
          if (seats?.length) {
            this.eventEmitter.emit("booking.expired", {
              showId,
              seats: seats.map(id => ({ id, sectionId: "" })),
            });
            this.logger.log(`Emitted booking.expired for ${seats.length} seats`);
          }
          await this.client.del(key);
          await this.client.del(dataKey);
          this.logger.log(`Cleaned up keys ${key} & ${dataKey}`);
        } catch (err) {
          this.logger.error("Cleanup handler error:", err);
        }
      }
    );
  }

  async onModuleDestroy() {
    this.logger.log("onModuleDestroy()");
    if (this.subscriber) await this.subscriber.quit();
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  async set(key: string, value: string, ttl?: number): Promise<"OK"> {
    if (ttl) {
      return this.client.setex(key, ttl, value);
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
      this.logger.error(`Error getting key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this.client.exists(key);
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Error setting expiration for key ${key}:`, error);
      throw error;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      throw error;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      throw error;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      return await this.client.decr(key);
    } catch (error) {
      this.logger.error(`Error decrementing key ${key}:`, error);
      throw error;
    }
  }

  async incrBy(key: string, value: number): Promise<number> {
    try {
      return await this.client.incrby(key, value);
    } catch (error) {
      this.logger.error(
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
      this.logger.error(
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
      this.logger.error(`Error setting hash field ${field} for key ${key}:`, error);
      throw error;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      this.logger.error(`Error getting hash field ${field} for key ${key}:`, error);
      throw error;
    }
  }

  async hdel(key: string, field: string): Promise<number> {
    try {
      return await this.client.hdel(key, field);
    } catch (error) {
      this.logger.error(
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
      this.logger.error(`Error getting all hash fields for key ${key}:`, error);
      throw error;
    }
  }

  async setWithLock(key: string, value: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.set(key, value, "EX", ttl, "NX");
      return result === "OK";
    } catch (error) {
      this.logger.error(`Error setting key ${key} with lock:`, error);
      throw error;
    }
  }
}

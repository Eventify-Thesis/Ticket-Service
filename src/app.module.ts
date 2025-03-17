import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { BullModule } from "@nestjs/bull";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { LoggerModule } from "nestjs-pino";
import { TerminusModule } from "@nestjs/terminus";
import { RedisModule } from "./shared/redis/redis.module";
import { HealthModule } from "./health/health.module";
import { TicketModule } from "./ticket/ticket.module";
import configuration from "./config/configuration";
import { CircuitBreakerModule } from "./shared/circuit-breaker/circuit-breaker.module";
import { MetricsModule } from "./shared/metrics/metrics.module";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: configuration,
    }),

    // Logger
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level:
            config.get("app.environment") === "development" ? "debug" : "info",
          transport:
            config.get("app.environment") === "development"
              ? { target: "pino-pretty" }
              : undefined,
        },
      }),
    }),

    // MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>("database.uri"),
        ...config.get("database.options"),
      }),
    }),

    // Redis
    RedisModule,

    // Bull Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        redis: {
          host: config.get("redis.host"),
          port: config.get("redis.port"),
          password: config.get("redis.password"),
          maxRetriesPerRequest: config.get("redis.maxRetriesPerRequest"),
        },
      }),
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get("rateLimit.ttl"),
        limit: config.get("rateLimit.limit"),
      }),
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Health Checks
    TerminusModule,
    HealthModule,

    // Circuit Breaker
    CircuitBreakerModule,

    // Metrics
    MetricsModule,

    // Feature Modules
    TicketModule,
  ],
})
export class AppModule {}

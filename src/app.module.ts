import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bull";
import { ScheduleModule } from "@nestjs/schedule";
import { LoggerModule } from "nestjs-pino";
import { ThrottlerModule } from "@nestjs/throttler";
import { HealthModule } from "./health/health.module";
import { RedisModule } from "./shared/redis/redis.module";
import { TerminusModule } from "@nestjs/terminus";
import { SeatModule } from "./seat/seat.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
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

    // TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("DATABASE_HOST"),
        port: configService.get("DATABASE_PORT"),
        username: configService.get("DATABASE_USERNAME"),
        password: configService.get("DATABASE_PASSWORD"),
        database: configService.get("DATABASE_NAME"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        synchronize: configService.get("DATABASE_SYNCHRONIZE") === "true",
      }),
      inject: [ConfigService],
    }),

    // Redis
    RedisModule,

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

    SeatModule,
    BookingsModule,
  ],
})
export class AppModule { }

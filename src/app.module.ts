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
import { PaymentsModule } from './payments/payments.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { EmailModule } from './email/email.module';
import * as handlebarsHelpers from 'handlebars-helpers';

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

    // Mail
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        transport: {
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: cfg.get('SENDGRID_API_KEY'),
          },
        },
        defaults: {
          from: cfg.get('MAIL_FROM'),
        },
        template: {
          dir: join(__dirname, 'templates', 'email'),
          adapter: new HandlebarsAdapter({ ...handlebarsHelpers }), // or your preferred template engine
          options: {
            strict: true,
          },
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

    SeatModule,
    BookingsModule,
    PaymentsModule,
    EmailModule,
  ],
})
export class AppModule { }

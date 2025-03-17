import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BullModule } from "@nestjs/bull";
import { ThrottlerModule } from "@nestjs/throttler";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TicketController } from "./controllers/ticket.controller";
import { TicketService } from "./services/ticket.service";
import { TicketProcessor } from "./processors/ticket.processor";
import { Ticket, TicketSchema } from "./entities/ticket.entity";
import { Reservation, ReservationSchema } from "./entities/reservation.entity";
import { RedisModule } from "../shared/redis/redis.module";
import { CircuitBreakerModule } from "../shared/circuit-breaker/circuit-breaker.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: Reservation.name, schema: ReservationSchema },
    ]),
    BullModule.registerQueue({
      name: "ticket-operations",
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get("rateLimit.ttl"),
        limit: config.get("rateLimit.limit"),
      }),
    }),
    RedisModule,
    CircuitBreakerModule,
  ],
  controllers: [TicketController],
  providers: [TicketService, TicketProcessor],
  exports: [TicketService],
})
export class TicketModule {}

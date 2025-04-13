import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BookingsService } from "./bookings.service";
import { BookingsController } from "./bookings.controller";
import { Order, OrderItem } from "./entities/order.entity";
import { RedisModule } from "../shared/redis/redis.module";
import { TicketType } from "./entities/ticket-type.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, TicketType]),
    RedisModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}

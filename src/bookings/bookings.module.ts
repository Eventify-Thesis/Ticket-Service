import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BookingsService } from "./bookings.service";
import { BookingsController } from "./bookings.controller";
import { Order, OrderItem } from "./entities/order.entity";
import { RedisModule } from "../shared/redis/redis.module";
import { TicketType } from "./entities/ticket-type.entity";
import { SeatModule } from "src/seat/seat.module";
import { Voucher } from "./entities/voucher.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, TicketType, Voucher]),
    RedisModule,
    SeatModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule { }

import { Module } from "@nestjs/common";
import { SeatService } from "./seat.service";
import { SeatController } from "./seat.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Seat } from "./entities/seat.entity";
import { RedisModule } from "src/shared/redis/redis.module";
import { TicketType } from "./entities/ticket-type.entity";
import { SeatCategoryMapping } from "./entities/seat-category-mapping.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Seat, TicketType, SeatCategoryMapping]),
    RedisModule,
  ],
  controllers: [SeatController],
  providers: [SeatService],
  exports: [SeatService],
})
export class SeatModule {}

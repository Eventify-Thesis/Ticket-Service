import { Module } from "@nestjs/common";
import { SeatService } from "./seat.service";
import { SeatController } from "./seat.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Seat } from "./entities/seat.entity";
import { RedisModule } from "src/shared/redis/redis.module";

@Module({
  imports: [TypeOrmModule.forFeature([Seat]), RedisModule],
  controllers: [SeatController],
  providers: [SeatService],
  exports: [SeatService],
})
export class SeatModule {}

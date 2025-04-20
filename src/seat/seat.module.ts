import { Module } from "@nestjs/common";
import { SeatService } from "./seat.service";
import { SeatController } from "./seat.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Seat } from "./entities/seat.entity";
import { RedisModule } from "src/shared/redis/redis.module";
import { TicketType } from "./entities/ticket-type.entity";
import { SeatCategoryMapping } from "./entities/seat-category-mapping.entity";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'GATEWAY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 8079,
        },
      },
    ]),
    TypeOrmModule.forFeature([Seat, TicketType, SeatCategoryMapping]),
    RedisModule,
  ],
  controllers: [SeatController],
  providers: [SeatService],
  exports: [SeatService],
})
export class SeatModule { }

import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/bookings/entities/order.entity';
import { RedisModule } from 'src/shared/redis/redis.module';
import { OrdersService } from './order.service';
import { EmailModule } from 'src/email/email.module';
import { EventStatisticsService } from './event-statistics.service';
@Module({
  imports: [TypeOrmModule.forFeature([Order]), RedisModule,
    EmailModule
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, OrdersService, EventStatisticsService]
})
export class PaymentsModule { }

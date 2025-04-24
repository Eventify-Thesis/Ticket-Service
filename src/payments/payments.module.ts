import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/bookings/entities/order.entity';
import { RedisModule } from 'src/shared/redis/redis.module';
@Module({
  imports: [TypeOrmModule.forFeature([Order]), RedisModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService]
})
export class PaymentsModule { }

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Order, OrderStatus } from 'src/bookings/entities/order.entity';
import { TicketType } from 'src/bookings/entities/ticket-type.entity';
import { DataSource } from 'typeorm';
import { RedisService } from 'src/shared/redis/redis.service';
import { Seat, SeatStatus } from 'src/seat/entities/seat.entity';
import { BookingAnswer } from 'src/bookings/entities/booking-answer.entity';

interface PaymentSuccessPayload {
  orderId: number;
  paymentIntentId: string;
  amount: number;
  status: string;
  paidAt: Date;
}

interface PaymentFailurePayload {
  orderId: number;
  paymentIntentId: string;
  errorMessage?: string;
}

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly dataSource: DataSource;
  private readonly redisService: RedisService;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    dataSource: DataSource,
    redisService: RedisService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    this.dataSource = dataSource;
    this.redisService = redisService;
  }

  async createPaymentIntent(orderId: number): Promise<{ clientSecret: string; amount: number }> {
    const order = await this.orderRepo.findOneByOrFail({ id: orderId });

    const amount = Math.round(order.totalAmount);

    const pi = await this.stripe.paymentIntents.create({
      amount,
      currency: 'vnd',
      automatic_payment_methods: { enabled: true },
      metadata: { orderId },
    });

    order.stripePaymentIntentId = pi.id;
    await this.orderRepo.save(order);

    return { clientSecret: pi.client_secret!, amount };
  }

  async handleSuccessfulPayment(payload: PaymentSuccessPayload) {
    const { orderId, paymentIntentId, paidAt } = payload;

    // Start a transaction to ensure data consistency
    await this.dataSource.transaction(async manager => {
      // 1. Get order and items
      const order = await manager.findOneOrFail(Order, {
        where: { id: orderId },
        relations: ['items']
      });

      // 2. Update order status
      order.status = OrderStatus.PAID;
      order.paidAt = paidAt;
      order.stripePaymentIntentId = paymentIntentId;
      await manager.save(order);

      // 3. Update seat status and ticket type quantities
      for (const item of order.items) {
        if (item.seatId) {
          // Remove seat lock from Redis
          await this.redisService.del(this.getSeatLockKey(item.seatId));

          // Update seat status to SOLD in the database
          await manager.update(Seat, item.seatId, { status: SeatStatus.BOOKED });
        }

        // Update ticket type sold quantity
        await manager.increment(
          TicketType,
          { id: item.ticketTypeId },
          'soldQuantity',
          item.quantity
        );
      }

      // 4. Clean up Redis keys
      await Promise.all([
        this.redisService.del(this.getBookingKey(order.showId, order.bookingCode)),
        this.redisService.del(this.getBookingCleanupKey(order.showId, order.bookingCode)),
        this.redisService.del(this.getBookingAnswerKey(order.showId, order.bookingCode))
      ]);
    });
  }

  async handleFailedPayment(payload: PaymentFailurePayload) {
    const { orderId, paymentIntentId, errorMessage } = payload;
    const order = await this.orderRepo.findOneByOrFail({ id: orderId });

    // Update order status
    order.status = OrderStatus.PAYMENT_FAILED;
    order.stripePaymentIntentId = paymentIntentId;
    order.stripePaymentErrorMessage = errorMessage;
    await this.orderRepo.save(order);
  }

  private getSeatLockKey(seatId: string): string {
    return `seat:lock:${seatId}`;
  }

  private getBookingKey(showId: number, bookingCode: string): string {
    return `booking:${showId}:${bookingCode}`;
  }

  private getBookingCleanupKey(showId: number, bookingCode: string): string {
    return `booking:cleanup:${showId}:${bookingCode}`;
  }

  private getBookingAnswerKey(showId: number, bookingCode: string): string {
    return `booking:answer:${showId}:${bookingCode}`;
  }
}

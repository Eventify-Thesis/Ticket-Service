import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Order, OrderStatus } from 'src/bookings/entities/order.entity';

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

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  async createPaymentIntent(orderId: number): Promise<{ clientSecret: string; amount: number }> {
    const order = await this.orderRepo.findOneByOrFail({ id: orderId });

    const amount = Math.round(order.subtotalAmount);
    console.log('amount', amount);

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
    const order = await this.orderRepo.findOneByOrFail({ id: orderId });

    // Update order status
    order.status = OrderStatus.PAID;
    order.paidAt = paidAt;
    order.stripePaymentIntentId = paymentIntentId;
    await this.orderRepo.save(order);
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
}

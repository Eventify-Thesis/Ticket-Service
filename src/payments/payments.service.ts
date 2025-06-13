import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import Stripe from "stripe";
import { RedisService } from "src/shared/redis/redis.service";
import { OrderStatus } from "src/bookings/entities/order.entity";
import { OrdersService } from "./order.service";

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
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
    dataSource: DataSource,
    redisService: RedisService
  ) {
    const stripeSecretKey = this.configService.get<string>("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    this.stripe = new Stripe(stripeSecretKey);
    this.dataSource = dataSource;
    this.redisService = redisService;
  }

  async createPaymentIntent(
    orderId: number
  ): Promise<{ clientSecret: string; amount: number }> {
    const order = await this.ordersService.getOrder(orderId);

    const amount = Math.round(order.totalAmount);

    const pi = await this.stripe.paymentIntents.create({
      amount,
      currency: "vnd",
      automatic_payment_methods: { enabled: true },
      metadata: { orderId },
    });

    order.stripePaymentIntentId = pi.id;
    await this.ordersService.saveOrder(order);

    return { clientSecret: pi.client_secret!, amount };
  }

  async handleSuccessfulPayment(payload: PaymentSuccessPayload): Promise<void> {
    await this.ordersService.completeOrderPayment(payload.orderId, {
      paymentIntentId: payload.paymentIntentId,
      paidAt: payload.paidAt,
    });
  }

  async handleFailedPayment(payload: PaymentFailurePayload) {
    const { orderId, paymentIntentId, errorMessage } = payload;
    const order = await this.ordersService.getOrder(orderId);

    // Update order status
    order.status = OrderStatus.PAYMENT_FAILED;
    order.stripePaymentIntentId = paymentIntentId;
    order.stripePaymentErrorMessage = errorMessage;
    await this.ordersService.saveOrder(order);
  }
}

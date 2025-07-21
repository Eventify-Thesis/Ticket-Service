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

  async initiateVietnamesePayment(payload: {
    paymentIntentId: string;
    paymentProvider: string;
    amount: number;
    currency: string;
    orderId?: string;
  }) {
    console.log("Initiating Vietnamese payment:", payload);

    try {
      // Get the order to update
      const order = await this.ordersService.getOrder(Number(payload.orderId));

      if (!order) {
        throw new Error(`Order not found: ${payload.orderId}`);
      }

      // Update order with payment provider information
      order.paymentProvider = payload.paymentProvider;
      order.paymentProviderTransactionId = payload.paymentIntentId;
      order.paymentProviderMetadata = JSON.stringify({
        paymentIntentId: payload.paymentIntentId,
        paymentProvider: payload.paymentProvider,
        amount: payload.amount,
        currency: payload.currency,
        initiatedAt: new Date().toISOString(),
      });

      // Set order status to PROCESSING (payment initiated)
      order.status = OrderStatus.PENDING;

      // Save the updated order
      await this.ordersService.saveOrder(order);

      // Generate payment URL based on provider
      let paymentUrl = "";

      switch (payload.paymentProvider) {
        case "zalopay":
          paymentUrl =
            process.env.NODE_ENV === "development"
              ? "https://sb-openapi.zalopay.vn/v2/create"
              : "https://openapi.zalopay.vn/v2/create";
          break;
        case "momo":
          paymentUrl =
            process.env.NODE_ENV === "development"
              ? "https://test-payment.momo.vn/v2/gateway/api/create"
              : "https://payment.momo.vn/v2/gateway/api/create";
          break;
        case "payoo":
          paymentUrl =
            process.env.NODE_ENV === "development"
              ? "https://sbgateway.payoo.vn/v2/create"
              : "https://gateway.payoo.vn/v2/create";
          break;
        default:
          throw new Error(
            `Unsupported payment provider: ${payload.paymentProvider}`
          );
      }

      console.log("Vietnamese payment initiated successfully:", {
        orderId: order.id,
        paymentProvider: payload.paymentProvider,
        paymentIntentId: payload.paymentIntentId,
        status: order.status,
      });

      return {
        success: true,
        paymentUrl,
        paymentIntentId: payload.paymentIntentId,
        paymentProvider: payload.paymentProvider,
        orderId: order.id,
        orderStatus: order.status,
        message: `Payment initiated for ${payload.paymentProvider}`,
      };
    } catch (error) {
      console.error("Failed to initiate Vietnamese payment:", error);
      return {
        success: false,
        error: error.message || "Failed to initiate payment",
      };
    }
  }

  async handleVietnamesePaymentSuccess(payload: {
    orderId: number;
    paymentIntentId: string;
    paymentProvider: string;
    amount: number;
    transactionId?: string;
  }): Promise<void> {
    console.log("Handling Vietnamese payment success:", payload);

    try {
      // Use the same payment completion flow as Stripe payments
      await this.ordersService.completeOrderPayment(payload.orderId, {
        paymentIntentId: payload.paymentIntentId,
        paidAt: new Date(),
      });

      console.log("Vietnamese payment completed successfully:", {
        orderId: payload.orderId,
        paymentProvider: payload.paymentProvider,
        paymentIntentId: payload.paymentIntentId,
      });
    } catch (error) {
      console.error("Failed to handle Vietnamese payment success:", error);
      throw error;
    }
  }
}

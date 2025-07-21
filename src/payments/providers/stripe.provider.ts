import Stripe from "stripe";
import {
  PaymentProvider,
  PaymentIntent,
  PaymentResult,
  WebhookEvent,
  PaymentIntentStatus,
} from "../interfaces/payment-provider.interface";

export class StripeProvider extends PaymentProvider {
  private readonly stripe: Stripe;

  constructor(config: { secretKey: string; webhookSecret: string }) {
    super("Stripe", "stripe", config);
    this.stripe = new Stripe(config.secretKey);
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: metadata || {},
    });

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: this.mapStripeStatus(paymentIntent.status),
      clientSecret: paymentIntent.client_secret,
      metadata: paymentIntent.metadata,
    };
  }

  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: this.mapStripeStatus(paymentIntent.status),
      clientSecret: paymentIntent.client_secret,
      metadata: paymentIntent.metadata,
    };
  }

  async handleWebhook(event: WebhookEvent): Promise<PaymentResult | null> {
    switch (event.type) {
      case "payment_intent.succeeded":
        const succeededPaymentIntent = event.data as Stripe.PaymentIntent;
        return {
          success: true,
          paymentIntentId: succeededPaymentIntent.id,
          transactionId: succeededPaymentIntent.id, // Use payment intent ID as transaction ID
          amount: succeededPaymentIntent.amount,
          currency: succeededPaymentIntent.currency,
          status: PaymentIntentStatus.SUCCEEDED,
          paidAt: new Date(),
          metadata: succeededPaymentIntent.metadata,
        };

      case "payment_intent.payment_failed":
        const failedPaymentIntent = event.data as Stripe.PaymentIntent;
        return {
          success: false,
          paymentIntentId: failedPaymentIntent.id,
          amount: failedPaymentIntent.amount,
          currency: failedPaymentIntent.currency,
          status: PaymentIntentStatus.FAILED,
          errorMessage: failedPaymentIntent.last_payment_error?.message,
          metadata: failedPaymentIntent.metadata,
        };

      default:
        return null;
    }
  }

  verifyWebhook(payload: string, signature: string): boolean {
    try {
      this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.config.webhookSecret
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  private mapStripeStatus(
    status: Stripe.PaymentIntent.Status
  ): PaymentIntentStatus {
    switch (status) {
      case "requires_payment_method":
      case "requires_confirmation":
        return PaymentIntentStatus.PENDING;
      case "requires_action":
        return PaymentIntentStatus.REQUIRES_ACTION;
      case "processing":
        return PaymentIntentStatus.PROCESSING;
      case "succeeded":
        return PaymentIntentStatus.SUCCEEDED;
      case "canceled":
        return PaymentIntentStatus.CANCELLED;
      default:
        return PaymentIntentStatus.FAILED;
    }
  }
}

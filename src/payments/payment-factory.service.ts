import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  PaymentProvider,
  PaymentMethod,
  PaymentIntent,
  PaymentResult,
  WebhookEvent,
} from "./interfaces/payment-provider.interface";
import { StripeProvider } from "./providers/stripe.provider";
import { ZaloPayProvider } from "./providers/zalopay.provider";
import { MoMoProvider } from "./providers/momo.provider";
import { PayooProvider } from "./providers/payoo.provider";

@Injectable()
export class PaymentFactoryService {
  private providers: Map<string, PaymentProvider> = new Map();
  private availablePaymentMethods: PaymentMethod[] = [];

  constructor(private readonly configService: ConfigService) {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize Stripe
    const stripeConfig = {
      secretKey: this.configService.get<string>("STRIPE_SECRET_KEY"),
      webhookSecret: this.configService.get<string>("STRIPE_WEBHOOK_SECRET"),
    };

    if (stripeConfig.secretKey) {
      const stripeProvider = new StripeProvider(stripeConfig);
      this.providers.set("stripe", stripeProvider);
      this.availablePaymentMethods.push({
        id: "stripe",
        name: "Credit/Debit Card",
        type: "stripe",
        logo: "/images/stripe-logo.png",
        description: "Pay with your credit or debit card",
        enabled: true,
        config: stripeConfig,
      });
    }

    // Initialize ZaloPay
    const zalopayConfig = {
      appId: this.configService.get<string>("ZALOPAY_APP_ID"),
      key1: this.configService.get<string>("ZALOPAY_KEY1"),
      key2: this.configService.get<string>("ZALOPAY_KEY2"),
      endpoint: this.configService.get<string>(
        "ZALOPAY_ENDPOINT",
        "https://sb-openapi.zalopay.vn"
      ),
      callbackUrl: this.configService.get<string>("ZALOPAY_CALLBACK_URL"),
    };

    if (zalopayConfig.appId && zalopayConfig.key1 && zalopayConfig.key2) {
      const zalopayProvider = new ZaloPayProvider(zalopayConfig);
      this.providers.set("zalopay", zalopayProvider);
      this.availablePaymentMethods.push({
        id: "zalopay",
        name: "ZaloPay",
        type: "zalopay",
        logo: "/images/zalopay-logo.png",
        description: "Pay with ZaloPay e-wallet",
        enabled: true,
        config: zalopayConfig,
      });
    }

    // Initialize MoMo
    const momoConfig = {
      partnerCode: this.configService.get<string>("MOMO_PARTNER_CODE"),
      accessKey: this.configService.get<string>("MOMO_ACCESS_KEY"),
      secretKey: this.configService.get<string>("MOMO_SECRET_KEY"),
      endpoint: this.configService.get<string>(
        "MOMO_ENDPOINT",
        "https://test-payment.momo.vn"
      ),
      callbackUrl: this.configService.get<string>("MOMO_CALLBACK_URL"),
      returnUrl: this.configService.get<string>("MOMO_RETURN_URL"),
    };

    if (
      momoConfig.partnerCode &&
      momoConfig.accessKey &&
      momoConfig.secretKey
    ) {
      const momoProvider = new MoMoProvider(momoConfig);
      this.providers.set("momo", momoProvider);
      this.availablePaymentMethods.push({
        id: "momo",
        name: "MoMo",
        type: "momo",
        logo: "/images/momo-logo.png",
        description: "Pay with MoMo e-wallet",
        enabled: true,
        config: momoConfig,
      });
    }

    // Initialize Payoo
    const payooConfig = {
      businessId: this.configService.get<string>("PAYOO_BUSINESS_ID"),
      businessUsername: this.configService.get<string>(
        "PAYOO_BUSINESS_USERNAME"
      ),
      apiKey: this.configService.get<string>("PAYOO_API_KEY"),
      apiSecret: this.configService.get<string>("PAYOO_API_SECRET"),
      endpoint: this.configService.get<string>(
        "PAYOO_ENDPOINT",
        "https://api.payoo.vn"
      ),
      callbackUrl: this.configService.get<string>("PAYOO_CALLBACK_URL"),
      returnUrl: this.configService.get<string>("PAYOO_RETURN_URL"),
    };

    if (payooConfig.businessId && payooConfig.apiKey && payooConfig.apiSecret) {
      const payooProvider = new PayooProvider(payooConfig);
      this.providers.set("payoo", payooProvider);
      this.availablePaymentMethods.push({
        id: "payoo",
        name: "Payoo",
        type: "payoo",
        logo: "/images/payoo-logo.png",
        description: "Pay via bank transfer or POS",
        enabled: true,
        config: payooConfig,
      });
    }
  }

  getAvailablePaymentMethods(): PaymentMethod[] {
    return this.availablePaymentMethods.filter((method) => method.enabled);
  }

  getProvider(paymentMethodId: string): PaymentProvider | null {
    return this.providers.get(paymentMethodId) || null;
  }

  async createPaymentIntent(
    paymentMethodId: string,
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    const provider = this.getProvider(paymentMethodId);
    if (!provider) {
      throw new Error(`Payment provider not found: ${paymentMethodId}`);
    }

    return provider.createPaymentIntent(amount, currency, metadata);
  }

  async getPaymentIntent(
    paymentMethodId: string,
    paymentIntentId: string
  ): Promise<PaymentIntent> {
    const provider = this.getProvider(paymentMethodId);
    if (!provider) {
      throw new Error(`Payment provider not found: ${paymentMethodId}`);
    }

    return provider.getPaymentIntent(paymentIntentId);
  }

  async handleWebhook(
    paymentMethodId: string,
    event: WebhookEvent
  ): Promise<PaymentResult | null> {
    const provider = this.getProvider(paymentMethodId);
    if (!provider) {
      throw new Error(`Payment provider not found: ${paymentMethodId}`);
    }

    return provider.handleWebhook(event);
  }

  verifyWebhook(
    paymentMethodId: string,
    payload: string,
    signature: string
  ): boolean {
    const provider = this.getProvider(paymentMethodId);
    if (!provider) {
      throw new Error(`Payment provider not found: ${paymentMethodId}`);
    }

    return provider.verifyWebhook(payload, signature);
  }

  // Helper method to determine payment method from webhook
  detectPaymentMethodFromWebhook(
    headers: Record<string, string>,
    body: any
  ): string | null {
    // Stripe webhook detection
    if (headers["stripe-signature"]) {
      return "stripe";
    }

    // ZaloPay webhook detection
    if (body.app_id && body.mac && body.zp_trans_id) {
      return "zalopay";
    }

    // MoMo webhook detection
    if (body.partnerCode && body.transId && body.signature) {
      return "momo";
    }

    // Payoo webhook detection
    if (body.BusinessId && body.TransactionId && body.Signature) {
      return "payoo";
    }

    return null;
  }
}

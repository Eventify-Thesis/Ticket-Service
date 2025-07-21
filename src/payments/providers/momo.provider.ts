import {
  PaymentProvider,
  PaymentIntent,
  PaymentResult,
  WebhookEvent,
  PaymentIntentStatus,
} from "../interfaces/payment-provider.interface";
import * as crypto from "crypto";

interface MoMoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
  callbackUrl: string;
  returnUrl: string;
}

interface MoMoCreatePaymentRequest {
  partnerCode: string;
  accessKey: string;
  requestId: string;
  amount: number;
  orderId: string;
  orderInfo: string;
  returnUrl: string;
  notifyUrl: string;
  extraData: string;
  requestType: string;
  signature: string;
}

interface MoMoCreatePaymentResponse {
  partnerCode: string;
  requestId: string;
  orderId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl: string;
  deeplink: string;
  qrCodeUrl: string;
}

export class MoMoProvider extends PaymentProvider {
  protected readonly config: MoMoConfig;

  constructor(config: MoMoConfig) {
    super("MoMo", "momo", config);
    this.config = config;
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    const requestId = `${this.config.partnerCode}_${Date.now()}`;
    const orderId = metadata?.orderId || `order_${Date.now()}`;
    const orderInfo = metadata?.description || "Payment for order";
    const extraData = JSON.stringify(metadata || {});

    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.config.partnerCode}&requestId=${requestId}&returnUrl=${this.config.returnUrl}`;
    const signature = crypto
      .createHmac("sha256", this.config.secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestData: MoMoCreatePaymentRequest = {
      partnerCode: this.config.partnerCode,
      accessKey: this.config.accessKey,
      requestId,
      amount: Math.round(amount),
      orderId,
      orderInfo,
      returnUrl: this.config.returnUrl,
      notifyUrl: this.config.callbackUrl,
      extraData,
      requestType: "payWithATM",
      signature,
    };

    try {
      const response = await fetch(
        `${this.config.endpoint}/v2/gateway/api/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const result: MoMoCreatePaymentResponse = await response.json();

      if (result.resultCode === 0) {
        return {
          id: orderId,
          amount: Math.round(amount),
          currency: currency.toUpperCase(),
          status: PaymentIntentStatus.PENDING,
          redirectUrl: result.payUrl,
          qrCode: result.qrCodeUrl,
          metadata: {
            ...metadata,
            requestId,
            deeplink: result.deeplink,
          },
        };
      } else {
        throw new Error(`MoMo order creation failed: ${result.message}`);
      }
    } catch (error) {
      throw new Error(`MoMo API error: ${error.message}`);
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    const requestId = `${this.config.partnerCode}_${Date.now()}`;
    const rawSignature = `accessKey=${this.config.accessKey}&orderId=${paymentIntentId}&partnerCode=${this.config.partnerCode}&requestId=${requestId}`;
    const signature = crypto
      .createHmac("sha256", this.config.secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestData = {
      partnerCode: this.config.partnerCode,
      accessKey: this.config.accessKey,
      requestId,
      orderId: paymentIntentId,
      signature,
    };

    try {
      const response = await fetch(
        `${this.config.endpoint}/v2/gateway/api/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const result = await response.json();

      let status: PaymentIntentStatus;
      if (result.resultCode === 0) {
        status = PaymentIntentStatus.SUCCEEDED;
      } else if (result.resultCode === 1006) {
        status = PaymentIntentStatus.FAILED;
      } else {
        status = PaymentIntentStatus.PENDING;
      }

      return {
        id: paymentIntentId,
        amount: result.amount || 0,
        currency: "VND",
        status,
        metadata: result,
      };
    } catch (error) {
      throw new Error(`MoMo query error: ${error.message}`);
    }
  }

  async handleWebhook(event: WebhookEvent): Promise<PaymentResult | null> {
    const { data } = event;

    if (data.resultCode === 0) {
      return {
        success: true,
        paymentIntentId: data.orderId,
        transactionId: data.transId,
        amount: data.amount,
        currency: "VND",
        status: PaymentIntentStatus.SUCCEEDED,
        paidAt: new Date(data.responseTime),
        metadata: data,
      };
    } else {
      return {
        success: false,
        paymentIntentId: data.orderId,
        amount: data.amount,
        currency: "VND",
        status: PaymentIntentStatus.FAILED,
        errorMessage: data.message,
        metadata: data,
      };
    }
  }

  verifyWebhook(payload: string, signature: string): boolean {
    try {
      const data = JSON.parse(payload);
      const rawSignature = `accessKey=${this.config.accessKey}&amount=${data.amount}&extraData=${data.extraData}&message=${data.message}&orderId=${data.orderId}&partnerCode=${data.partnerCode}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}&transId=${data.transId}`;
      const computedSignature = crypto
        .createHmac("sha256", this.config.secretKey)
        .update(rawSignature)
        .digest("hex");
      return computedSignature === data.signature;
    } catch (error) {
      return false;
    }
  }
}

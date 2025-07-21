import {
  PaymentProvider,
  PaymentIntent,
  PaymentResult,
  WebhookEvent,
  PaymentIntentStatus,
} from "../interfaces/payment-provider.interface";
import * as crypto from "crypto";

interface ZaloPayConfig {
  appId: string;
  key1: string;
  key2: string;
  endpoint: string;
  callbackUrl: string;
}

interface ZaloPayCreateOrderRequest {
  app_id: string;
  app_trans_id: string;
  app_user: string;
  app_time: number;
  amount: number;
  description: string;
  bank_code: string;
  item: string;
  embed_data: string;
  mac: string;
  callback_url?: string;
  redirect_url?: string;
}

interface ZaloPayCreateOrderResponse {
  return_code: number;
  return_message: string;
  sub_return_code: number;
  sub_return_message: string;
  zp_trans_token: string;
  order_url: string;
  order_token: string;
  qr_code?: string;
}

export class ZaloPayProvider extends PaymentProvider {
  protected readonly config: ZaloPayConfig;

  constructor(config: ZaloPayConfig) {
    super("ZaloPay", "zalopay", config);
    this.config = config;
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    const appTransId = `${new Date().getFormat("yyMMdd")}_${this.config.appId}_${Date.now()}`;
    const appTime = Date.now();
    const embedData = JSON.stringify({
      preferred_payment_method: ["zalopay_wallet"],
      ...metadata,
    });

    const orderData = {
      app_id: this.config.appId,
      app_trans_id: appTransId,
      app_user: metadata?.userId || "user",
      app_time: appTime,
      amount: Math.round(amount),
      description: metadata?.description || "Payment for order",
      bank_code: "",
      item: JSON.stringify([]),
      embed_data: embedData,
      callback_url: this.config.callbackUrl,
    };

    const mac = this.generateMac(orderData);
    const requestData: ZaloPayCreateOrderRequest = {
      ...orderData,
      mac,
    };

    try {
      const response = await fetch(`${this.config.endpoint}/v2/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result: ZaloPayCreateOrderResponse = await response.json();

      if (result.return_code === 1) {
        return {
          id: appTransId,
          amount: Math.round(amount),
          currency: currency.toUpperCase(),
          status: PaymentIntentStatus.PENDING,
          redirectUrl: result.order_url,
          qrCode: result.qr_code,
          metadata: {
            ...metadata,
            zp_trans_token: result.zp_trans_token,
            order_token: result.order_token,
          },
        };
      } else {
        throw new Error(
          `ZaloPay order creation failed: ${result.return_message}`
        );
      }
    } catch (error) {
      throw new Error(`ZaloPay API error: ${error.message}`);
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    const appTime = Date.now();
    const data = `${this.config.appId}|${paymentIntentId}|${this.config.key1}`;
    const mac = crypto
      .createHmac("sha256", this.config.key1)
      .update(data)
      .digest("hex");

    const requestData = {
      app_id: this.config.appId,
      app_trans_id: paymentIntentId,
      mac,
    };

    try {
      const response = await fetch(`${this.config.endpoint}/v2/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      let status: PaymentIntentStatus;
      if (result.return_code === 1) {
        status = PaymentIntentStatus.SUCCEEDED;
      } else if (result.return_code === 2) {
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
      throw new Error(`ZaloPay query error: ${error.message}`);
    }
  }

  async handleWebhook(event: WebhookEvent): Promise<PaymentResult | null> {
    const { data } = event;

    if (data.type === "payment.succeeded") {
      return {
        success: true,
        paymentIntentId: data.app_trans_id,
        transactionId: data.zp_trans_id,
        amount: data.amount,
        currency: "VND",
        status: PaymentIntentStatus.SUCCEEDED,
        paidAt: new Date(data.server_time),
        metadata: data,
      };
    } else if (data.type === "payment.failed") {
      return {
        success: false,
        paymentIntentId: data.app_trans_id,
        amount: data.amount,
        currency: "VND",
        status: PaymentIntentStatus.FAILED,
        errorMessage: data.error_message,
        metadata: data,
      };
    }

    return null;
  }

  verifyWebhook(payload: string, signature: string): boolean {
    try {
      const data = JSON.parse(payload);
      const checksumData = `${data.app_id}|${data.app_trans_id}|${data.app_user}|${data.amount}|${data.server_time}|${data.zp_trans_id}|${data.status}|${this.config.key2}`;
      const computedMac = crypto
        .createHmac("sha256", this.config.key2)
        .update(checksumData)
        .digest("hex");
      return computedMac === data.mac;
    } catch (error) {
      return false;
    }
  }

  private generateMac(orderData: any): string {
    const data = `${orderData.app_id}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.embed_data}|${orderData.item}`;
    return crypto
      .createHmac("sha256", this.config.key1)
      .update(data)
      .digest("hex");
  }
}

// Extend Date prototype for ZaloPay date format
declare global {
  interface Date {
    getFormat(format: string): string;
  }
}

Date.prototype.getFormat = function (format: string): string {
  const year = this.getFullYear().toString().substr(-2);
  const month = (this.getMonth() + 1).toString().padStart(2, "0");
  const day = this.getDate().toString().padStart(2, "0");

  return format.replace("yy", year).replace("MM", month).replace("dd", day);
};

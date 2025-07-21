import {
  PaymentProvider,
  PaymentIntent,
  PaymentResult,
  WebhookEvent,
  PaymentIntentStatus,
} from "../interfaces/payment-provider.interface";
import * as crypto from "crypto";

interface PayooConfig {
  businessId: string;
  businessUsername: string;
  apiKey: string;
  apiSecret: string;
  endpoint: string;
  callbackUrl: string;
  returnUrl: string;
}

interface PayooCreatePaymentRequest {
  BusinessId: string;
  OrderNo: string;
  Amount: number;
  Description: string;
  ReturnUrl: string;
  CancelUrl: string;
  NotifyUrl: string;
  RequestId: string;
  Signature: string;
}

interface PayooCreatePaymentResponse {
  ResultCode: number;
  ResultMessage: string;
  PaymentUrl: string;
  OrderNo: string;
  Amount: number;
  QRCode?: string;
}

export class PayooProvider extends PaymentProvider {
  protected readonly config: PayooConfig;

  constructor(config: PayooConfig) {
    super("Payoo", "payoo", config);
    this.config = config;
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    const requestId = `${this.config.businessId}_${Date.now()}`;
    const orderNo = metadata?.orderId || `order_${Date.now()}`;
    const description = metadata?.description || "Payment for order";

    const signatureData = `${this.config.businessId}|${orderNo}|${amount}|${description}|${this.config.returnUrl}|${this.config.callbackUrl}|${requestId}|${this.config.apiSecret}`;
    const signature = crypto
      .createHash("sha256")
      .update(signatureData)
      .digest("hex");

    const requestData: PayooCreatePaymentRequest = {
      BusinessId: this.config.businessId,
      OrderNo: orderNo,
      Amount: Math.round(amount),
      Description: description,
      ReturnUrl: this.config.returnUrl,
      CancelUrl: this.config.returnUrl,
      NotifyUrl: this.config.callbackUrl,
      RequestId: requestId,
      Signature: signature,
    };

    try {
      const response = await fetch(
        `${this.config.endpoint}/v2/payments/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      const result: PayooCreatePaymentResponse = await response.json();

      if (result.ResultCode === 0) {
        return {
          id: orderNo,
          amount: Math.round(amount),
          currency: currency.toUpperCase(),
          status: PaymentIntentStatus.PENDING,
          redirectUrl: result.PaymentUrl,
          qrCode: result.QRCode,
          metadata: {
            ...metadata,
            requestId,
            orderNo,
          },
        };
      } else {
        throw new Error(`Payoo order creation failed: ${result.ResultMessage}`);
      }
    } catch (error) {
      throw new Error(`Payoo API error: ${error.message}`);
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    const requestId = `${this.config.businessId}_${Date.now()}`;
    const signatureData = `${this.config.businessId}|${paymentIntentId}|${requestId}|${this.config.apiSecret}`;
    const signature = crypto
      .createHash("sha256")
      .update(signatureData)
      .digest("hex");

    const requestData = {
      BusinessId: this.config.businessId,
      OrderNo: paymentIntentId,
      RequestId: requestId,
      Signature: signature,
    };

    try {
      const response = await fetch(
        `${this.config.endpoint}/v2/payments/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      const result = await response.json();

      let status: PaymentIntentStatus;
      if (result.ResultCode === 0) {
        switch (result.PaymentStatus) {
          case "SUCCESS":
            status = PaymentIntentStatus.SUCCEEDED;
            break;
          case "FAILED":
            status = PaymentIntentStatus.FAILED;
            break;
          case "PENDING":
          default:
            status = PaymentIntentStatus.PENDING;
            break;
        }
      } else {
        status = PaymentIntentStatus.FAILED;
      }

      return {
        id: paymentIntentId,
        amount: result.Amount || 0,
        currency: "VND",
        status,
        metadata: result,
      };
    } catch (error) {
      throw new Error(`Payoo query error: ${error.message}`);
    }
  }

  async handleWebhook(event: WebhookEvent): Promise<PaymentResult | null> {
    const { data } = event;

    if (data.ResultCode === 0) {
      return {
        success: true,
        paymentIntentId: data.OrderNo,
        transactionId: data.TransactionId,
        amount: data.Amount,
        currency: "VND",
        status: PaymentIntentStatus.SUCCEEDED,
        paidAt: new Date(data.PaymentTime),
        metadata: data,
      };
    } else {
      return {
        success: false,
        paymentIntentId: data.OrderNo,
        amount: data.Amount,
        currency: "VND",
        status: PaymentIntentStatus.FAILED,
        errorMessage: data.ResultMessage,
        metadata: data,
      };
    }
  }

  verifyWebhook(payload: string, signature: string): boolean {
    try {
      const data = JSON.parse(payload);
      const signatureData = `${data.BusinessId}|${data.OrderNo}|${data.Amount}|${data.ResultCode}|${data.TransactionId}|${data.PaymentTime}|${this.config.apiSecret}`;
      const computedSignature = crypto
        .createHash("sha256")
        .update(signatureData)
        .digest("hex");
      return computedSignature === signature;
    } catch (error) {
      return false;
    }
  }
}

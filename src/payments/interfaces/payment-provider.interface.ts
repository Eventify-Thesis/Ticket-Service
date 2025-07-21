export interface PaymentMethod {
  id: string;
  name: string;
  type: "stripe" | "zalopay" | "momo" | "payoo";
  logo?: string;
  description?: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  clientSecret?: string;
  redirectUrl?: string;
  qrCode?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId: string;
  transactionId?: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  paidAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  metadata?: Record<string, any>;
}

export enum PaymentIntentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REQUIRES_ACTION = "requires_action",
}

export abstract class PaymentProvider {
  protected readonly name: string;
  protected readonly type: PaymentMethod["type"];
  protected readonly config: Record<string, any>;

  constructor(
    name: string,
    type: PaymentMethod["type"],
    config: Record<string, any>
  ) {
    this.name = name;
    this.type = type;
    this.config = config;
  }

  abstract createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent>;

  abstract getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent>;

  abstract handleWebhook(event: WebhookEvent): Promise<PaymentResult | null>;

  abstract verifyWebhook(payload: string, signature: string): boolean;

  getType(): PaymentMethod["type"] {
    return this.type;
  }

  getName(): string {
    return this.name;
  }
}

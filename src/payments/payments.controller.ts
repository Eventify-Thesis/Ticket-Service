import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  RawBodyRequest,
  Req,
} from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { ApiTags } from "@nestjs/swagger";
import Stripe from "stripe";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  private readonly stripe: Stripe;

  constructor(private readonly paymentsService: PaymentsService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  @MessagePattern("createPaymentIntent")
  async createPaymentIntent(@Payload() orderId: number) {
    const { clientSecret, amount } =
      await this.paymentsService.createPaymentIntent(orderId);
    return { clientSecret, amount };
  }

  @MessagePattern("handleSuccessfulPayment")
  async handleSuccessfulPayment(
    @Payload()
    payload: {
      orderId: number;
      paymentIntentId: string;
      amount: number;
      status: string;
      paidAt: Date;
    }
  ) {
    await this.paymentsService.handleSuccessfulPayment(payload);
    return { success: true };
  }

  @MessagePattern("handleFailedPayment")
  async handleFailedPayment(
    @Payload()
    payload: {
      orderId: number;
      paymentIntentId: string;
      errorMessage?: string;
    }
  ) {
    await this.paymentsService.handleFailedPayment(payload);
    return { success: true };
  }
}

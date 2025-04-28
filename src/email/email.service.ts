import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { generateOrderConfirmationEmail } from '../templates/email/order-confirmation.template';

@Injectable()
export class EmailService {
  constructor(private readonly mailer: MailerService) { }

  async sendConfirmation(order: any, event: any) {
    const html = generateOrderConfirmationEmail(order, event);

    return this.mailer.sendMail({
      to: order.email,
      subject: `Payment Successful - Your Tickets for ${event.eventName}`,
      html,
    });
  }
}

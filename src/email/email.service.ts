import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { generateOrderConfirmationEmail, generateTicketEmail } from '../templates/email/order-confirmation.template';

@Injectable()
export class EmailService {
  constructor(private readonly mailer: MailerService) { }

  async sendConfirmation(order: any, event: any) {
    if (!order?.email) {
      throw new Error('Order email is required');
    }

    // Send confirmation to order owner
    const orderHtml = generateOrderConfirmationEmail(order, event);
    await this.mailer.sendMail({
      to: order.email,
      subject: `Payment Successful - Your Tickets for ${event.eventName}`,
      html: orderHtml,
    });

    // Skip sending individual tickets if no attendees
    if (!order?.attendees?.length) {
      return;
    }

    // Group attendees by email
    const attendeesByEmail = order.attendees.reduce((acc: Record<string, any[]>, attendee) => {
      if (!attendee?.email) return acc;

      if (!acc[attendee.email]) {
        acc[attendee.email] = [];
      }
      acc[attendee.email].push(attendee);
      return acc;
    }, {});

    // Send tickets to each unique attendee email
    for (const [email, attendees] of Object.entries<any[]>(attendeesByEmail)) {
      // Skip if it's the same as the order owner's email or no attendees
      if (!attendees?.length) continue;

      const ticketHtml = generateTicketEmail(attendees, event);
      await this.mailer.sendMail({
        to: email,
        subject: `Your Tickets for ${event.eventName}`,
        html: ticketHtml,
      });
    }
  }
}

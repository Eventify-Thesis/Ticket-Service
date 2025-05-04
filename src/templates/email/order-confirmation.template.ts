interface EventInfo {
  eventName: string;
  orgLogoUrl: string;
  orgName: string;
  venueName: string;
  street: string;
}

interface Attendee {
  firstName: string;
  lastName: string;
  publicId: string;
  email: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  firstName: string;
  lastName: string;
  createdAt: Date;
  subtotalAmount: number;
  platformDiscountAmount: number;
  totalAmount: number;
  items: OrderItem[];
  attendees?: Attendee[];
}

export const generateTicketEmail = (attendees: Attendee[], event: EventInfo): string => {
  const ticketsList = attendees.map((attendee) => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(attendee.publicId)}`;
    return `
      <div style="margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
        <h3 style="margin: 0 0 15px 0; color: #1a73e8;">${attendee.firstName} ${attendee.lastName}</h3>
        <p style="margin: 5px 0; color: #666;">Ticket ID: ${attendee.publicId}</p>
        <div style="text-align: center; margin-top: 20px;">
          <img src="${qrCodeUrl}" alt="Ticket QR Code" style="width: 200px; height: 200px;">
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Your Tickets - ${event.eventName}</title>
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 20px;">
          <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #1a73e8, #0d47a1); border-radius: 8px 8px 0 0;">
            <img src="${event.orgLogoUrl}" alt="${event.orgName}" style="max-width: 180px; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Your Tickets</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px;">Here are your tickets for <strong>${event.eventName}</strong>. Each ticket includes a unique QR code that will be scanned at the event entrance.</p>
            
            ${ticketsList}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #666;">
              <p>Save these tickets or take a screenshot. You'll need to show them at the event.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const generateOrderConfirmationEmail = (order: any, event: any) => {
  const ticketsList = order.items
    .map(
      (item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e4e4e4;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: right;">${Math.round(item.price).toLocaleString('vi-VN')} VND</td>
      </tr>
    `
    )
    .join('');

  const attendeesList = order.attendees?.map(
    (attendee: any) => `
    <div style="margin-bottom: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
      <p style="margin: 5px 0;"><strong>${attendee.firstName} ${attendee.lastName}</strong></p>
      <p style="margin: 5px 0; color: #666;">${attendee.email}</p>
    </div>
  `
  ).join('') || '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Success - Order Confirmation</title>
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 20px;">
          <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #1a73e8, #0d47a1); border-radius: 8px 8px 0 0;">
            <img src="${event.orgLogoUrl}" alt="${event.orgName}" style="max-width: 180px; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Payment Successful!</h1>
          </div>
          
          <div style="padding: 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background-color: #e8f5e9; padding: 10px 20px; border-radius: 50px;">
                <span style="color: #2e7d32; font-weight: bold;">✓ Order Confirmed</span>
              </div>
            </div>

            <p style="font-size: 16px;">Dear <strong>${order.firstName} ${order.lastName}</strong>,</p>
            
            <p style="font-size: 16px;">Thank you for your purchase! Your payment has been successfully processed, and your tickets for <strong>${event.eventName}</strong> have been confirmed.</p>
            
            <div style="background-color: #f8f9fa; padding: 25px; margin: 25px 0; border-radius: 8px; border: 1px solid #e9ecef;">
              <h3 style="color: #1a73e8; margin-top: 0; margin-bottom: 20px; font-size: 20px;">Order Summary</h3>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}</p>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px; background-color: #ffffff; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f1f3f4;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e4e4e4;">Ticket Type</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e4e4e4;">Quantity</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e4e4e4;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${ticketsList}
                </tbody>
                <tfoot style="background-color: #f8f9fa;">
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right;"><strong>Subtotal:</strong></td>
                    <td style="padding: 12px; text-align: right;"><strong>${Math.round(order.subtotalAmount).toLocaleString('vi-VN')} VND</strong></td>
                  </tr>
                  ${order.platformDiscountAmount ? `
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right; color: #2e7d32;"><strong>Discount:</strong></td>
                    <td style="padding: 12px; text-align: right; color: #2e7d32;"><strong>-${Math.round(order.platformDiscountAmount).toLocaleString('vi-VN')} VND</strong></td>
                  </tr>
                  ` : ''}
                  <tr style="background-color: #e3f2fd;">
                    <td colspan="2" style="padding: 12px; text-align: right;"><strong>Total Paid:</strong></td>
                    <td style="padding: 12px; text-align: right;"><strong>${Math.round(order.totalAmount).toLocaleString('vi-VN')} VND</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style="background-color: #fff3e0; padding: 25px; margin: 25px 0; border-radius: 8px; border: 1px solid #ffe0b2;">
              <h3 style="color: #e65100; margin-top: 0; margin-bottom: 20px; font-size: 20px;">Event Details</h3>
              <p style="margin: 10px 0;"><strong>Event:</strong> ${event.eventName}</p>
              <p style="margin: 10px 0;"><strong>Venue:</strong> ${event.venueName}</p>
              <p style="margin: 10px 0;"><strong>Address:</strong> ${event.street}</p>
            </div>

            ${attendeesList ? `
            <div style="background-color: #f3e5f5; padding: 25px; margin: 25px 0; border-radius: 8px; border: 1px solid #e1bee7;">
              <h3 style="color: #6a1b9a; margin-top: 0; margin-bottom: 20px; font-size: 20px;">Attendee Information</h3>
              ${attendeesList}
            </div>
            ` : ''}

            <div style="background-color: #e3f2fd; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #1565c0;">
                <strong>Need Help?</strong> If you have any questions about your order, our support team is here to help!
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e4;">
              <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
              <p style="color: #666; font-size: 12px;">${new Date().getFullYear()} ${event.orgName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

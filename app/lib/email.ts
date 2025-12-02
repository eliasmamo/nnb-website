import { Resend } from 'resend';
import { formatCurrency, formatDate } from './utils';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendBookingConfirmationParams {
  to: string;
  guestName: string;
  referenceCode: string;
  roomType: string;
  checkInDate: Date;
  checkOutDate: Date;
  totalPrice: number;
}

function generateEmailHTML(params: {
  guestName: string;
  referenceCode: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: string;
  bookingLink: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #9c9b77 0%, #7a7960 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0 0 10px 0;">Booking Confirmed! ✓</h1>
    <p style="margin: 0;">Thank you for choosing N&B Hotel</p>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
    <p>Dear ${params.guestName},</p>
    
    <p>Your booking has been successfully confirmed. We're excited to welcome you!</p>
    
    <div style="background: white; border: 2px solid #9c9b77; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your Booking Reference</p>
      <div style="font-size: 32px; font-weight: bold; color: #9c9b77; letter-spacing: 2px;">${params.referenceCode}</div>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Save this code to access your booking</p>
    </div>
    
    <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #9c9b77;">Booking Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0;">Room Type:</td>
          <td style="padding: 10px 0; text-align: right;"><strong>${params.roomType}</strong></td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0;">Check-in:</td>
          <td style="padding: 10px 0; text-align: right;"><strong>${params.checkInDate}</strong></td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0;">Check-out:</td>
          <td style="padding: 10px 0; text-align: right;"><strong>${params.checkOutDate}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">Total Amount:</td>
          <td style="padding: 10px 0; text-align: right;"><strong>${params.totalPrice}</strong></td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 20px 0;">
      <a href="${params.bookingLink}" style="display: inline-block; background: #9c9b77; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">View Booking Details</a>
    </div>
    
    <div style="background: #e8f5e9; padding: 15px; border-radius: 6px; margin-top: 20px;">
      <h4 style="margin: 0 0 10px 0; color: #2e7d32;">What's Next?</h4>
      <ul style="margin: 0; padding-left: 20px;">
        <li>You'll receive check-in instructions 24 hours before arrival</li>
        <li>Online check-in will be available from the link above</li>
        <li>Check-in time: After 2:00 PM</li>
        <li>Check-out time: Before 11:00 AM</li>
      </ul>
    </div>
    
    <p style="margin-top: 30px;">If you have any questions, feel free to reply to this email or contact us at <a href="mailto:info@nnb.hotel" style="color: #9c9b77;">info@nnb.hotel</a></p>
    
    <p>We look forward to hosting you!</p>
    <p><strong>The N&B Hotel Team</strong></p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
    <p>N&B Hotel - Smart Living for Digital Nomads</p>
    <p>123 City Center Street, Downtown</p>
    <p>This is an automated message. Please do not reply directly to this email.</p>
  </div>
</body>
</html>
  `;
}

export async function sendBookingConfirmation(params: SendBookingConfirmationParams) {
  try {
    const bookingLink = `${process.env.APP_BASE_URL}/my-booking`;
    
    const htmlContent = generateEmailHTML({
      guestName: params.guestName,
      referenceCode: params.referenceCode,
      roomType: params.roomType,
      checkInDate: formatDate(params.checkInDate),
      checkOutDate: formatDate(params.checkOutDate),
      totalPrice: formatCurrency(params.totalPrice),
      bookingLink,
    });
    
    // Use Resend's test email for development, or verified domain for production
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: `Booking Confirmation - ${params.referenceCode}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }

    console.log('✅ Email sent successfully:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
}
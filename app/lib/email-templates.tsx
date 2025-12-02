import * as React from 'react';

interface BookingConfirmationEmailProps {
  guestName: string;
  referenceCode: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: string;
  bookingLink: string;
}

export const BookingConfirmationEmail: React.FC<BookingConfirmationEmailProps> = ({
  guestName,
  referenceCode,
  roomType,
  checkInDate,
  checkOutDate,
  totalPrice,
  bookingLink,
}) => (
  <html>
    <head>
      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #9c9b77 0%, #7a7960 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .reference-box {
          background: white;
          border: 2px solid #9c9b77;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
          border-radius: 8px;
        }
        .reference-code {
          font-size: 32px;
          font-weight: bold;
          color: #9c9b77;
          letter-spacing: 2px;
        }
        .details {
          background: white;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .button {
          display: inline-block;
          background: #9c9b77;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
      `}</style>
    </head>
    <body>
      <div className="header">
        <h1>Booking Confirmed! ✓</h1>
        <p>Thank you for choosing N&B Hotel</p>
      </div>
      
      <div className="content">
        <p>Dear {guestName},</p>
        
        <p>Your booking has been successfully confirmed. We're excited to welcome you!</p>
        
        <div className="reference-box">
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>Your Booking Reference</p>
          <div className="reference-code">{referenceCode}</div>
          <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>Save this code to access your booking</p>
        </div>
        
        <div className="details">
          <h3 style={{ marginTop: 0, color: '#9c9b77' }}>Booking Details</h3>
          <div className="detail-row">
            <span>Room Type:</span>
            <strong>{roomType}</strong>
          </div>
          <div className="detail-row">
            <span>Check-in:</span>
            <strong>{checkInDate}</strong>
          </div>
          <div className="detail-row">
            <span>Check-out:</span>
            <strong>{checkOutDate}</strong>
          </div>
          <div className="detail-row">
            <span>Total Amount:</span>
            <strong>{totalPrice}</strong>
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <a href={bookingLink} className="button">View Booking Details</a>
        </div>
        
        <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '6px', marginTop: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>What's Next?</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>You'll receive check-in instructions 24 hours before arrival</li>
            <li>Online check-in will be available from the link above</li>
            <li>Check-in time: After 2:00 PM</li>
            <li>Check-out time: Before 11:00 AM</li>
          </ul>
        </div>
        
        <p style={{ marginTop: '30px' }}>If you have any questions, feel free to reply to this email or contact us at <a href="mailto:info@nnb.hotel">info@nnb.hotel</a></p>
        
        <p>We look forward to hosting you!</p>
        <p><strong>The N&B Hotel Team</strong></p>
      </div>
      
      <div className="footer">
        <p>N&B Hotel - Smart Living for Digital Nomads</p>
        <p>123 City Center Street, Downtown</p>
        <p>This is an automated message. Please do not reply directly to this email.</p>
      </div>
    </body>
  </html>
);
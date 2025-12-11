# Guest Portal Documentation

## Overview

The Guest Portal provides a secure, personalized web page for each guest during their stay. It's accessible via a magic link sent in the check-in completion email.

## Features

### ✅ Secure Access
- **Magic Link Authentication** - No passwords needed
- **JWT-based tokens** - Cryptographically signed
- **Auto-expiring** - Token expires at checkout date
- **Single-use per booking** - Each booking gets unique token

### ✅ Guest Experience
- **Zero friction** - One click from email
- **Mobile-friendly** - Works on any device
- **Always accessible** - View PIN code anytime during stay
- **No app required** - Works in any browser

### ✅ Information Displayed
- Room number
- PIN code (large, easy to read)
- Validity period
- Check-in/out dates
- Booking reference
- Access instructions

## Architecture

```
Flow:
1. Guest completes online check-in
2. System generates JWT token for booking
3. Magic link sent in check-in email
4. Guest clicks link → auto-authenticated
5. Portal displays personalized stay info
6. Token expires after checkout
```

## Security

### Token Generation
- Uses `jose` library for JWT
- Signed with `JWT_SECRET` from environment
- Contains: bookingId, guestEmail, guestName, roomNumber
- Expiration set to booking checkout date

### Token Validation
- Verifies JWT signature
- Checks booking status (must be CHECKED_IN)
- Validates checkout date hasn't passed
- Ensures booking and room still exist

### Best Practices
- ✅ Tokens are single-use per booking
- ✅ No sensitive data in token payload
- ✅ Server-side validation on every request
- ✅ Automatic expiration
- ✅ HTTPS required in production

## Implementation

### Files Created

1. **`app/lib/guest-auth.ts`**
   - Token generation and verification
   - Magic link creation
   - Session management

2. **`app/guest-portal/page.tsx`**
   - Guest portal UI
   - Displays room info and PIN
   - Quick action buttons

3. **`app/api/guest-portal/route.ts`**
   - API endpoint for portal data
   - Token validation
   - Fetches booking and lock key info

4. **Email Integration**
   - Updated `app/lib/email.ts`
   - Added magic link button to check-in email
   - Updated `app/api/check-in/route.ts`

## Configuration

### Environment Variables

```bash
# Required
JWT_SECRET="your-secret-key-change-in-production"
APP_BASE_URL="https://yourdomain.com"

# For email
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="checkin@yourdomain.com"
```

### Generate Secure JWT Secret

```bash
# Generate a random 32-byte secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Usage

### For Guests

1. Complete online check-in
2. Receive email with "View Your Guest Portal" button
3. Click button → instant access
4. View room number, PIN code, and instructions
5. Access anytime during stay
6. Link expires automatically after checkout

### For Developers

#### Generate Magic Link Manually

```typescript
import { createGuestSession } from '@/app/lib/guest-auth';

const magicLink = await createGuestSession(bookingId);
// Returns: https://yourdomain.com/guest-portal?token=eyJhbGc...
```

#### Verify Token

```typescript
import { verifyGuestToken } from '@/app/lib/guest-auth';

const session = await verifyGuestToken(token);
if (session) {
  console.log('Guest:', session.guestName);
  console.log('Room:', session.roomNumber);
}
```

## Testing

### Test the Flow

1. **Create a test booking:**
   ```bash
   npm run db:seed
   ```

2. **Complete check-in:**
   - Go to `/check-in`
   - Enter reference code: `DEMO01`
   - Complete check-in form

3. **Check email:**
   - Look for check-in completion email
   - Click "View Your Guest Portal" button

4. **Verify portal:**
   - Should see guest name, room number, PIN
   - All information should be correct
   - Link should work until checkout date

### Manual Testing

```bash
# Generate token for a booking
npx tsx -e "
import { createGuestSession } from './app/lib/guest-auth';
const link = await createGuestSession('BOOKING_ID');
console.log(link);
"
```

## Future Enhancements

### Planned Features
- [ ] Request housekeeping service
- [ ] Order room service
- [ ] Live chat with reception
- [ ] Early checkout option
- [ ] Review and feedback form
- [ ] Local recommendations
- [ ] Extend stay option

### Integration Ideas
- [ ] WhatsApp notifications
- [ ] SMS with magic link
- [ ] QR code for quick access
- [ ] Add to Apple Wallet
- [ ] Google Calendar integration

## Troubleshooting

### "Invalid or expired token"
- Token has expired (past checkout date)
- Booking status changed (not CHECKED_IN)
- JWT_SECRET changed
- Token was tampered with

### "No active lock key found"
- Lock key wasn't created during check-in
- Lock key was revoked
- Check lock_keys table in database

### Email not received
- Check Resend dashboard for delivery status
- Verify RESEND_FROM_EMAIL is correct
- Check spam folder
- Ensure domain is verified (for production)

## Security Considerations

### Production Checklist
- [ ] Use strong JWT_SECRET (32+ random bytes)
- [ ] Enable HTTPS only
- [ ] Set secure cookie flags
- [ ] Rate limit API endpoints
- [ ] Monitor for suspicious activity
- [ ] Regular token rotation policy
- [ ] Audit logs for access

### What NOT to do
- ❌ Don't store tokens in localStorage
- ❌ Don't share tokens between guests
- ❌ Don't use predictable secrets
- ❌ Don't skip HTTPS in production
- ❌ Don't expose tokens in URLs (use POST when possible)

## Support

For issues or questions:
- Check logs in Vercel dashboard
- Review communication_log table
- Test token generation manually
- Verify environment variables
- Check Resend delivery status

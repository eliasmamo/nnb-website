# TTLock Setup Quick Start

## 1. Get TTLock Credentials

1. Go to [TTLock Open Platform](https://open.ttlock.com) (or https://euopen.ttlock.com for EU)
2. Register/login with your TTLock account
3. Create a new application
4. Copy your `Client ID` and `Client Secret`

## 2. Configure Environment Variables

Add to your `.env` file:

```bash
# TTLock Configuration
TTLOCK_CLIENT_ID="your_client_id_here"
TTLOCK_CLIENT_SECRET="your_client_secret_here"
TTLOCK_USERNAME="your_ttlock_email_or_phone"
TTLOCK_PASSWORD="your_ttlock_password"
TTLOCK_BASE_URL="https://euapi.ttlock.com"
```

**Important**: Use the credentials you originally signed up with TTLock. If you registered with email, use email as username.

## 3. Get Your Lock IDs

You need to know the Lock ID for each physical lock. Two ways to get this:

### Option A: Via TTLock App
1. Open TTLock app
2. Go to lock settings
3. Look for "Lock ID" or similar field

### Option B: Via API (after configuring credentials)

Create a test script `scripts/list-locks.ts`:

```typescript
import { getTTLockClient } from '../app/lib/ttlock';

async function listLocks() {
  const client = getTTLockClient();
  const locks = await client.listLocks();
  console.log('Your locks:', JSON.stringify(locks, null, 2));
}

listLocks();
```

Run it:
```bash
npx tsx scripts/list-locks.ts
```

## 4. Update Room Lock IDs in Database

```sql
-- Update each room with its corresponding lock ID
UPDATE rooms SET ttlock_lock_id = 'LOCK_ID_FROM_TTLOCK' WHERE room_number = '101';
UPDATE rooms SET ttlock_lock_id = 'LOCK_ID_FROM_TTLOCK' WHERE room_number = '102';
-- ... etc for all rooms
```

Or via Prisma Studio:
```bash
npm run db:studio
```
Then edit each room and add the `ttlockLockId`.

## 5. Test the Integration

### Test 1: Manual Lock Key Issuance

```bash
# First, get a booking ID from your database
# Then issue a lock key for it:

curl -X POST http://localhost:3000/api/lock-keys/issue \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "YOUR_BOOKING_ID"}'
```

Expected response:
```json
{
  "success": true,
  "lockKey": {
    "id": "clxxx...",
    "pinCode": "123456",
    "roomNumber": "101",
    "validFrom": "2024-12-10T14:00:00Z",
    "validTo": "2024-12-15T11:00:00Z"
  }
}
```

### Test 2: Full Check-in Flow

```bash
# Use the demo booking created by seed script
curl -X POST http://localhost:3000/api/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "referenceCode": "DEMO01",
    "guestDetails": {
      "passportNumber": "AB123456",
      "nationality": "US",
      "passportIssueDate": "1990-01-01",
      "estimatedArrivalTime": "14:00"
    }
  }'
```

The response should include a `lockKey` object with the PIN code.

### Test 3: Verify on Physical Lock

1. Go to the physical lock
2. Enter the PIN code from the response
3. Lock should open if:
   - Current time is within the valid period
   - Lock ID is correct
   - TTLock API accepted the passcode

## 6. Troubleshooting

### "TTLock configuration is incomplete"
- Check all environment variables are set in `.env`
- Restart your dev server after adding env vars

### "TTLock authentication failed"
- Verify username and password are correct
- Make sure you're using the credentials you originally registered with
- Try logging into TTLock app with same credentials

### "Room does not have a lock configured"
- Check `ttlock_lock_id` is set for the room in database
- Verify the lock ID is correct (not a placeholder like "LOCK_101")

### "No available rooms"
- Check room availability in database
- Make sure rooms have `is_active = true`
- Verify no overlapping bookings exist

### PIN doesn't work on lock
- Check the lock has internet connectivity (via gateway)
- Verify current time is within valid period
- Try refreshing lock via TTLock app
- Check TTLock app to see if passcode was created

## 7. Production Checklist

- [ ] Store TTLock credentials in secure secrets manager
- [ ] Consider encrypting PIN codes in database
- [ ] Set up monitoring for TTLock API failures
- [ ] Configure automatic key expiration cleanup job
- [ ] Test failover scenarios (API down, network issues)
- [ ] Document lock replacement procedure
- [ ] Set up alerts for failed key issuance
- [ ] Review TTLock API rate limits

## Need Help?

- TTLock API Docs: https://euopen.ttlock.com/doc/api/
- TTLock Support: Check their support portal
- Integration Guide: See `docs/TTLOCK_INTEGRATION.md`

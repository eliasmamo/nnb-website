# TTLock Integration Guide

This document explains how the TTLock smart lock integration works in the NNB Hotel application.

## Overview

The TTLock integration automatically generates time-limited PIN codes for guest room access after they complete online check-in.

## Architecture

```
Check-in Completion
    ↓
Lock Key Service
    ↓
TTLock API Client
    ↓
TTLock Cloud API
```

## Components

### 1. TTLock API Client (`app/lib/ttlock.ts`)

Handles authentication and communication with TTLock Cloud API:
- **OAuth2 authentication** with automatic token refresh
- **Create passcode** - Generates 6-digit PIN codes with time limits
- **Delete passcode** - Revokes access when booking is cancelled/completed
- **List locks** - Retrieves all locks in the account

### 2. Lock Key Service (`app/lib/lock-key-service.ts`)

Business logic layer that:
- **Allocates rooms** - Finds available rooms for bookings
- **Issues lock keys** - Creates PIN codes and stores them in database
- **Revokes keys** - Removes access when needed
- **Manages key lifecycle** - Tracks active/expired/revoked status

### 3. API Endpoints

#### POST `/api/lock-keys/issue`
Manually issue a lock key for a booking.

**Request:**
```json
{
  "bookingId": "clxxx..."
}
```

**Response:**
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

#### POST `/api/lock-keys/revoke`
Revoke all active lock keys for a booking.

**Request:**
```json
{
  "bookingId": "clxxx..."
}
```

#### GET `/api/lock-keys/status?bookingId=xxx`
Get current lock key status for a booking.

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# TTLock Configuration
TTLOCK_CLIENT_ID="your_client_id"
TTLOCK_CLIENT_SECRET="your_client_secret"
TTLOCK_USERNAME="your_ttlock_username"
TTLOCK_PASSWORD="your_ttlock_password"
TTLOCK_BASE_URL="https://euapi.ttlock.com"
```

### Getting TTLock Credentials

1. Register at [TTLock Open Platform](https://open.ttlock.com)
2. Create an application to get `CLIENT_ID` and `CLIENT_SECRET`
3. Use your TTLock account credentials for `USERNAME` and `PASSWORD`

### Room Configuration

Each room must have a `ttlock_lock_id` configured in the database:

```sql
UPDATE rooms 
SET ttlock_lock_id = 'YOUR_LOCK_ID' 
WHERE room_number = '101';
```

To find your lock IDs, you can use the TTLock app or call the API:
```bash
curl -X POST "https://euapi.ttlock.com/v3/lock/list" \
  -d "clientId=YOUR_CLIENT_ID" \
  -d "accessToken=YOUR_ACCESS_TOKEN"
```

## Workflow

### Automatic Lock Key Issuance

1. **Guest completes check-in** via `/api/check-in`
2. **System allocates a room** based on availability
3. **Lock key service creates PIN code** via TTLock API
4. **PIN code is stored** in `lock_keys` table
5. **Booking status** changes to `CHECKED_IN`
6. **Guest receives** PIN code via email/WhatsApp

### PIN Code Details

- **Format**: 6-digit random number (e.g., `123456`)
- **Valid from**: Check-in date at 2:00 PM
- **Valid to**: Check-out date at 11:00 AM
- **Type**: Time-limited custom passcode

### Key Revocation

Keys are automatically revoked when:
- Booking is cancelled
- Guest checks out
- Admin manually revokes access

## Database Schema

### LockKey Model

```prisma
model LockKey {
  id            String        @id @default(cuid())
  bookingId     String
  roomId        String
  ttlockLockId  String        // Lock ID from TTLock
  pinCode       String?       // 6-digit PIN
  validFrom     DateTime
  validTo       DateTime
  status        LockKeyStatus // ACTIVE, EXPIRED, REVOKED
  remoteId      String?       // TTLock keyboardPwdId
  createdAt     DateTime
  updatedAt     DateTime
}
```

## Testing

### Manual Test

1. **Create a booking** with reference code
2. **Complete check-in** via the check-in form
3. **Check the response** for `lockKey` object with PIN code
4. **Verify in database**:
   ```sql
   SELECT * FROM lock_keys WHERE booking_id = 'YOUR_BOOKING_ID';
   ```
5. **Test the PIN** on the physical lock

### Test with Demo Booking

```bash
# The seed script creates a demo booking with reference code DEMO01
npm run db:seed

# Complete check-in for the demo booking
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

## Error Handling

The integration includes comprehensive error handling:

- **Authentication failures** - Logs error and throws exception
- **API errors** - Captures TTLock error codes and messages
- **Network issues** - Retries with exponential backoff (future enhancement)
- **Lock key issuance failures** - Check-in completes but logs warning

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `TTLock configuration is incomplete` | Missing env variables | Check `.env` file |
| `TTLock authentication failed` | Invalid credentials | Verify username/password |
| `Room does not have a lock configured` | Missing `ttlock_lock_id` | Configure lock ID in database |
| `No available rooms` | All rooms occupied | Wait or manually assign room |

## Security Considerations

1. **PIN codes are stored in plaintext** - Consider encryption for production
2. **Access tokens are cached in memory** - Tokens expire after configured time
3. **API credentials in environment** - Use secrets management in production
4. **Time-limited access** - PINs automatically expire after checkout

## Future Enhancements

- [ ] Webkey support (unlock via web interface)
- [ ] IC card generation
- [ ] Fingerprint registration
- [ ] Gateway integration for remote unlock
- [ ] Automatic key expiration cleanup job
- [ ] Retry mechanism for failed API calls
- [ ] PIN code encryption at rest
- [ ] Multi-lock support per room
- [ ] Guest app integration

## API Documentation

Full TTLock API documentation: https://euopen.ttlock.com/doc/api/

Key endpoints used:
- `POST /oauth2/token` - Authentication
- `POST /v3/keyboardPwd/add` - Create passcode
- `POST /v3/keyboardPwd/delete` - Delete passcode
- `POST /v3/keyboardPwd/get` - Get passcode details
- `POST /v3/lock/list` - List locks

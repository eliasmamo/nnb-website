# Remote Access Features

## Overview

Enhanced guest portal with **remote unlock** and **TTLock app integration** (eKey) features.

## Features

### 1. 🔓 Remote Unlock

**Direct door unlock from guest portal** - no need to be at the door!

#### How It Works
1. Guest opens guest portal on their phone
2. Clicks "Unlock Door Now" button
3. API calls TTLock to unlock the door remotely
4. Door unlocks instantly (requires gateway connection)
5. Success message displayed

#### Technical Details
- **Endpoint**: `POST /api/guest-portal/unlock`
- **Authentication**: JWT token from magic link
- **TTLock API**: `/v3/lock/unlock`
- **Requirements**: Lock must be connected to TTLock gateway
- **Logging**: Action logged in communication_log

#### Use Cases
- Guest forgot something in room
- Unlock for delivery/housekeeping
- Help someone else access the room
- Convenience when hands are full

### 2. 📱 TTLock App Integration (eKey)

**Send digital key to guest's TTLock mobile app** for app-based access.

#### How It Works
1. **Automatic**: eKey sent during check-in (if guest has TTLock app)
2. **Manual**: Guest can request eKey from portal anytime
3. Guest receives notification in TTLock app
4. Guest can unlock via app (Bluetooth or remote)

#### Technical Details
- **Endpoint**: `POST /api/guest-portal/send-ekey`
- **Authentication**: JWT token from magic link
- **TTLock API**: `/v3/key/send`
- **Parameters**:
  - `lockId`: Room lock ID
  - `receiverUsername`: Guest email (must match TTLock account)
  - `startDate`: Check-in time (milliseconds)
  - `endDate`: Check-out time (milliseconds)
  - `remarks`: "Room 102 - John Doe"

#### Requirements
- Guest must have TTLock app installed
- Guest must be registered in TTLock with same email
- Lock must be added to your TTLock account

#### Benefits
- **Bluetooth unlock**: Works without internet
- **Remote unlock**: Unlock from anywhere
- **Backup access**: If PIN doesn't work
- **Modern experience**: App-based access

## Implementation

### Files Modified

1. **`app/lib/ttlock.ts`**
   - Added `unlockLock()` method
   - Added `sendEKey()` method

2. **`app/guest-portal/page.tsx`**
   - Added unlock button with loading state
   - Added eKey button with loading state
   - Added action message display

3. **`app/api/check-in/route.ts`**
   - Automatically sends eKey during check-in
   - Non-blocking (doesn't fail check-in if eKey fails)

### New API Endpoints

#### Unlock Door
```typescript
POST /api/guest-portal/unlock
Body: { token: string }
Response: { success: true, message: string }
```

#### Send eKey
```typescript
POST /api/guest-portal/send-ekey
Body: { token: string }
Response: { success: true, message: string, keyId: number }
```

## User Experience

### Guest Portal UI

```
┌─────────────────────────────────────┐
│  Room Access                        │
│  ┌──────────┐  ┌──────────┐        │
│  │ Room 102 │  │ PIN: 123456│       │
│  └──────────┘  └──────────┘        │
│                                     │
│  ┌──────────────┐ ┌──────────────┐ │
│  │ 🔓 Unlock    │ │ 📱 Send to   │ │
│  │ Door Now     │ │ TTLock App   │ │
│  └──────────────┘ └──────────────┘ │
│                                     │
│  ✅ Door unlocked successfully!    │
└─────────────────────────────────────┘
```

### Button States

**Unlock Button:**
- Default: "🔓 Unlock Door Now" (green)
- Loading: "Unlocking..." (spinner)
- Success: "✅ Door unlocked successfully!"
- Error: "❌ Failed to unlock door"

**eKey Button:**
- Default: "📱 Send to TTLock App" (purple)
- Loading: "Sending..." (spinner)
- Success: "✅ eKey sent to your TTLock app!"
- Error: "❌ Failed to send eKey - Make sure you have TTLock app"

## Testing

### Test Remote Unlock

1. Complete check-in for a booking
2. Open guest portal via magic link
3. Click "Unlock Door Now"
4. Check physical lock - should unlock
5. Check logs for unlock action

### Test eKey

1. **Setup**: Install TTLock app, register with guest email
2. Complete check-in (eKey sent automatically)
3. Check TTLock app for new key notification
4. Or click "Send to TTLock App" button manually
5. Verify key appears in app with correct dates

### Manual Testing

```bash
# Test unlock API directly
curl -X POST http://localhost:3000/api/guest-portal/unlock \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_GUEST_TOKEN"}'

# Test eKey API directly
curl -X POST http://localhost:3000/api/guest-portal/send-ekey \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_GUEST_TOKEN"}'
```

## Requirements

### For Remote Unlock
- ✅ Lock connected to TTLock gateway
- ✅ Gateway has internet connection
- ✅ Lock is online in TTLock system

### For eKey
- ✅ Guest has TTLock app installed
- ✅ Guest registered with same email as booking
- ✅ Lock added to your TTLock account
- ✅ Guest accepts eKey in app

## Error Handling

### Common Errors

**"Failed to unlock door"**
- Lock offline or not connected to gateway
- Gateway has no internet
- TTLock API error
- Invalid lock ID

**"Failed to send eKey"**
- Guest email not registered in TTLock
- Guest hasn't installed TTLock app
- Invalid lock ID
- TTLock API error
- eKey already sent (duplicate)

### Graceful Degradation

- ✅ Check-in succeeds even if eKey fails
- ✅ Guest can retry eKey from portal
- ✅ PIN code always works as backup
- ✅ Error messages guide user to solution

## Security

### Remote Unlock
- ✅ Requires valid guest token (JWT)
- ✅ Token expires at checkout
- ✅ Only works for guest's assigned room
- ✅ All unlocks logged
- ✅ Rate limiting recommended

### eKey
- ✅ Sent only to verified guest email
- ✅ Time-limited (check-in to checkout)
- ✅ Requires TTLock app authentication
- ✅ Can be revoked if needed
- ✅ Guest must accept in app

## Future Enhancements

### Planned
- [ ] Unlock history in portal
- [ ] Schedule unlock (e.g., for delivery)
- [ ] Share temporary access with others
- [ ] Push notifications on unlock
- [ ] Unlock from WhatsApp bot
- [ ] QR code for quick unlock

### Integration Ideas
- [ ] Smart home integration (lights, AC)
- [ ] Automated check-out unlock
- [ ] Emergency unlock for staff
- [ ] Unlock analytics dashboard

## Troubleshooting

### Remote Unlock Not Working

1. **Check lock status**
   ```bash
   npx tsx scripts/list-ttlock-locks.ts
   ```
   Look for `electricQuantity` and `lockData`

2. **Verify gateway connection**
   - Check TTLock app
   - Ensure gateway is online
   - Test unlock from TTLock app first

3. **Check logs**
   - Look for TTLock API errors
   - Verify lock ID is correct
   - Check communication_log table

### eKey Not Received

1. **Verify guest email**
   - Must match TTLock registration
   - Check for typos
   - Case-sensitive

2. **Check TTLock app**
   - App installed and logged in?
   - Notifications enabled?
   - Check "Keys" section in app

3. **Retry sending**
   - Use "Send to TTLock App" button
   - Check for error messages
   - Try different email if needed

## Best Practices

### For Guests
- ✅ Install TTLock app before arrival
- ✅ Register with booking email
- ✅ Enable notifications
- ✅ Test unlock before leaving reception area
- ✅ Keep PIN as backup

### For Hotel
- ✅ Mention TTLock app in pre-arrival email
- ✅ Provide app download links
- ✅ Test gateway connectivity regularly
- ✅ Monitor unlock logs
- ✅ Have backup access method (PIN)

## Support

### Guest Instructions

**For Remote Unlock:**
1. Open guest portal link from email
2. Scroll to "Room Access" section
3. Click "Unlock Door Now"
4. Wait for confirmation message
5. Door should unlock within 2-3 seconds

**For TTLock App:**
1. Download TTLock app (iOS/Android)
2. Register with your booking email
3. Accept eKey notification
4. Use app to unlock via Bluetooth or remote

### Contact Support
- Email: info@nnb.hotel
- Include: Booking reference, room number, error message
- Response time: < 15 minutes during stay

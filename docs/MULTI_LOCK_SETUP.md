# Multiple Lock Setup Guide

## Problem
You have multiple rooms but only one physical lock configured. When a booking is made, the system might allocate a room without a lock, causing PIN generation to fail.

## Solutions

### Option 1: Use One Lock for All Rooms (Testing/Demo)
For testing or if you only have one physical lock, you can assign the same lock ID to all rooms:

```sql
-- Update all rooms to use the same lock
UPDATE rooms SET ttlock_lock_id = '27371634';
```

**Pros:**
- Quick setup for testing
- Works with one physical lock

**Cons:**
- All guests get access to the same physical lock
- Not suitable for production with multiple actual rooms

### Option 2: Configure Multiple Locks (Production)
For production, each room should have its own lock:

1. **Add locks to your TTLock account:**
   - Use TTLock mobile app
   - Add each physical lock
   - Connect locks to gateway

2. **Get all lock IDs:**
   ```bash
   npx tsx scripts/list-ttlock-locks.ts
   ```

3. **Update each room:**
   ```sql
   UPDATE rooms SET ttlock_lock_id = 'LOCK_ID_1' WHERE room_number = '101';
   UPDATE rooms SET ttlock_lock_id = 'LOCK_ID_2' WHERE room_number = '102';
   UPDATE rooms SET ttlock_lock_id = 'LOCK_ID_3' WHERE room_number = '103';
   -- etc...
   ```

### Option 3: Restrict Bookable Rooms (Interim Solution)
If you only have a few locks configured, mark other rooms as inactive:

```sql
-- Only allow rooms with locks to be booked
UPDATE rooms SET is_active = false WHERE ttlock_lock_id IS NULL;

-- Or mark specific rooms
UPDATE rooms SET is_active = false WHERE room_number IN ('103', '104', '105');
```

This prevents the system from allocating rooms without locks.

## Recommended Approach

### For Testing/Development:
Use **Option 1** - assign the same lock to all rooms for quick testing.

### For Production:
Use **Option 2** + **Option 3**:
1. Configure locks for rooms you actually have
2. Mark rooms without locks as inactive
3. Gradually add more locks as you expand

## Quick Setup Script

Run this to assign your one lock to all active rooms:

```bash
npx prisma studio
```

Or create a script:

```typescript
// scripts/assign-lock-to-all-rooms.ts
import { prisma } from '../app/lib/prisma';

async function assignLockToAllRooms() {
  const lockId = '27371634'; // Your lock ID
  
  const result = await prisma.room.updateMany({
    where: { isActive: true },
    data: { ttlockLockId: lockId },
  });
  
  console.log(`✅ Updated ${result.count} rooms with lock ID`);
  await prisma.$disconnect();
}

assignLockToAllRooms();
```

## Validation

After setup, verify all bookable rooms have locks:

```sql
SELECT room_number, ttlock_lock_id, is_active 
FROM rooms 
WHERE is_active = true;
```

All active rooms should have a `ttlock_lock_id` value.

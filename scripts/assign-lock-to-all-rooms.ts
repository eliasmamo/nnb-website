/**
 * Script to assign one lock ID to all active rooms
 * Useful for testing with a single physical lock
 * Run: npx tsx scripts/assign-lock-to-all-rooms.ts
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { prisma } from '../app/lib/prisma';

// Load .env file
loadEnv({ path: resolve(__dirname, '../.env') });

async function assignLockToAllRooms() {
  try {
    const lockId = '27371634'; // Your lock ID from list-ttlock-locks.ts
    
    console.log('🔧 Assigning Lock to All Active Rooms\n');
    console.log(`Lock ID: ${lockId}\n`);

    // Get all active rooms
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      select: {
        id: true,
        roomNumber: true,
        ttlockLockId: true,
      },
    });

    console.log(`Found ${rooms.length} active rooms:\n`);
    
    rooms.forEach(room => {
      const status = room.ttlockLockId ? `✅ ${room.ttlockLockId}` : '❌ NOT SET';
      console.log(`  Room ${room.roomNumber}: ${status}`);
    });

    console.log('\n🔄 Updating all rooms...\n');

    // Update all active rooms
    const result = await prisma.room.updateMany({
      where: { isActive: true },
      data: { ttlockLockId: lockId },
    });

    console.log(`✅ Updated ${result.count} rooms with lock ID: ${lockId}\n`);
    
    console.log('⚠️  Note: All rooms now share the same physical lock.');
    console.log('   This is fine for testing, but for production you should:');
    console.log('   1. Add more physical locks to your TTLock account');
    console.log('   2. Assign unique lock IDs to each room');
    console.log('   3. Or mark rooms without locks as inactive\n');
    
    console.log('📖 See docs/MULTI_LOCK_SETUP.md for more information');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }
}

assignLockToAllRooms();

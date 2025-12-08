/**
 * Script to update room with TTLock lock ID
 * Run: npx tsx scripts/update-room-lock-id.ts
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { prisma } from '../app/lib/prisma';

// Load .env file
loadEnv({ path: resolve(__dirname, '../.env') });

async function updateRoomLockId() {
  try {
    console.log('🔧 Updating Room with Lock ID\n');

    const lockId = '27371634';
    const roomNumber = '102'; // Changed to 102 since that's what the seed created

    // Check current state
    const room = await prisma.room.findUnique({
      where: { roomNumber },
    });

    if (!room) {
      console.error(`❌ Room ${roomNumber} not found!`);
      return;
    }

    console.log(`📍 Room ${roomNumber}:`);
    console.log(`   Current Lock ID: ${room.ttlockLockId || 'NOT SET'}\n`);

    if (room.ttlockLockId === lockId) {
      console.log('✅ Lock ID is already set correctly!');
      return;
    }

    // Update the room
    console.log(`🔄 Updating to Lock ID: ${lockId}...`);
    
    const updated = await prisma.room.update({
      where: { roomNumber },
      data: { ttlockLockId: lockId },
    });

    console.log('✅ Room updated successfully!\n');
    console.log(`📋 Updated Room:`);
    console.log(`   Room Number: ${updated.roomNumber}`);
    console.log(`   Lock ID: ${updated.ttlockLockId}`);
    console.log(`   Active: ${updated.isActive}\n`);
    console.log('🎉 You can now run: npx tsx scripts/test-create-pin.ts');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRoomLockId();

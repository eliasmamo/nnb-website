/**
 * Script to test creating a PIN code for the demo booking
 * Run: npx tsx scripts/test-create-pin.ts
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { prisma } from '../app/lib/prisma';
import { issueLockKey } from '../app/lib/lock-key-service';

// Load .env file
loadEnv({ path: resolve(__dirname, '../.env') });

async function testCreatePin() {
  try {
    console.log('🔐 Testing PIN Code Generation\n');

    // Find the demo booking
    console.log('1️⃣ Finding demo booking...');
    const booking = await prisma.booking.findUnique({
      where: { referenceCode: 'DEMO01' },
      include: {
        roomType: true,
        room: true,
      },
    });

    if (!booking) {
      console.error('❌ Demo booking not found. Run: npm run db:seed');
      return;
    }

    console.log(`✅ Found booking: ${booking.referenceCode}`);
    console.log(`   Guest: ${booking.guestName}`);
    console.log(`   Check-in: ${booking.checkInDate.toISOString().split('T')[0]}`);
    console.log(`   Check-out: ${booking.checkOutDate.toISOString().split('T')[0]}`);
    console.log(`   Status: ${booking.status}\n`);

    // Check if room has lock configured
    if (booking.room && !booking.room.ttlockLockId) {
      console.error('❌ Room does not have a lock configured!');
      console.log('\n💡 Update the room with Lock ID:');
      console.log(`   UPDATE rooms SET ttlock_lock_id = '27371634' WHERE id = '${booking.room.id}';\n`);
      return;
    }

    // Check if booking has check-in info
    const checkInInfo = await prisma.checkInInfo.findUnique({
      where: { bookingId: booking.id },
    });

    if (!checkInInfo) {
      console.log('⚠️  Booking does not have check-in info. Creating it...\n');
      
      await prisma.checkInInfo.create({
        data: {
          bookingId: booking.id,
          legalName: booking.guestName,
          dateOfBirth: new Date('1990-01-01'),
          passportNumber: 'AB123456',
          nationality: 'US',
          address: null,
          additionalServices: {},
        },
      });

      console.log('✅ Check-in info created\n');
    }

    // Check if key already exists
    const existingKey = await prisma.lockKey.findFirst({
      where: {
        bookingId: booking.id,
        status: 'ACTIVE',
      },
    });

    if (existingKey) {
      console.log('⚠️  Active lock key already exists!');
      console.log(`   PIN Code: ${existingKey.pinCode}`);
      console.log(`   Valid from: ${existingKey.validFrom}`);
      console.log(`   Valid to: ${existingKey.validTo}\n`);
      console.log('💡 Delete it first if you want to create a new one:\n');
      console.log(`   DELETE FROM lock_keys WHERE id = '${existingKey.id}';\n`);
      return;
    }

    // Issue lock key
    console.log('2️⃣ Issuing lock key via TTLock API...\n');
    const result = await issueLockKey(booking.id);

    if (!result.success) {
      console.error('❌ Failed to issue lock key:', result.error);
      return;
    }

    console.log('✅ Lock key issued successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 PIN CODE DETAILS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`   PIN Code: ${result.lockKey?.pinCode}`);
    console.log(`   Room Number: ${result.lockKey?.roomNumber}`);
    console.log(`   Valid From: ${result.lockKey?.validFrom}`);
    console.log(`   Valid To: ${result.lockKey?.validTo}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 SUCCESS! You can now test the PIN on your physical lock!\n');
    console.log('📱 The PIN should also appear in your TTLock mobile app');
    console.log('   under the lock\'s passcode list.\n');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreatePin();

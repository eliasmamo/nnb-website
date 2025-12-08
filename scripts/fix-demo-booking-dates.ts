/**
 * Script to update demo booking dates to future dates
 * Run: npx tsx scripts/fix-demo-booking-dates.ts
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { prisma } from '../app/lib/prisma';

// Load .env file
loadEnv({ path: resolve(__dirname, '../.env') });

async function fixDemoBookingDates() {
  try {
    console.log('📅 Fixing Demo Booking Dates\n');

    const booking = await prisma.booking.findUnique({
      where: { referenceCode: 'DEMO01' },
    });

    if (!booking) {
      console.error('❌ Demo booking not found!');
      return;
    }

    console.log('Current dates:');
    console.log(`  Check-in: ${booking.checkInDate.toISOString().split('T')[0]}`);
    console.log(`  Check-out: ${booking.checkOutDate.toISOString().split('T')[0]}\n`);

    // Set check-in to today, check-out to next week
    // Force specific dates to avoid timezone issues
    const today = new Date('2025-12-08');
    const nextWeek = new Date('2025-12-15');

    console.log('Updating to:');
    console.log(`  Check-in: ${today.toISOString().split('T')[0]}`);
    console.log(`  Check-out: ${nextWeek.toISOString().split('T')[0]}\n`);

    const updated = await prisma.booking.update({
      where: { referenceCode: 'DEMO01' },
      data: {
        checkInDate: today,
        checkOutDate: nextWeek,
      },
    });

    console.log('✅ Booking dates updated!\n');
    console.log('🎉 Now run: npx tsx scripts/test-create-pin.ts');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDemoBookingDates();

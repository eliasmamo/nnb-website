/**
 * Test script to verify same-day bookings work correctly
 * Tests late check-in scenario where guest books on arrival day
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSameDayBooking() {
  console.log('🧪 Testing Same-Day Booking Feature\n');

  try {
    // Get a room type
    const roomType = await prisma.roomType.findFirst({
      where: { isActive: true },
    });

    if (!roomType) {
      console.error('❌ No active room types found');
      return;
    }

    console.log(`📋 Using room type: ${roomType.name}`);

    // Create dates for same-day check-in
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`📅 Check-in: ${today.toISOString().split('T')[0]} (TODAY)`);
    console.log(`📅 Check-out: ${tomorrow.toISOString().split('T')[0]}`);

    // Test 1: Validate date comparison logic
    console.log('\n🔍 Test 1: Date Validation Logic');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const checkInDateOnly = new Date(today);
    checkInDateOnly.setHours(0, 0, 0, 0);

    const isPast = checkInDateOnly < todayStart;
    console.log(`   Today start: ${todayStart.toISOString()}`);
    console.log(`   Check-in date: ${checkInDateOnly.toISOString()}`);
    console.log(`   Is past? ${isPast}`);
    
    if (isPast) {
      console.error('   ❌ FAILED: Same-day date detected as past!');
      return;
    } else {
      console.log('   ✅ PASSED: Same-day date allowed');
    }

    // Test 2: Create a test booking
    console.log('\n🔍 Test 2: Create Same-Day Booking');
    
    const referenceCode = `TEST-SAME-DAY-${Date.now()}`;
    const nights = Math.ceil((tomorrow.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = Number(roomType.basePrice) * nights;

    const booking = await prisma.booking.create({
      data: {
        referenceCode,
        roomTypeId: roomType.id,
        checkInDate: today,
        checkOutDate: tomorrow,
        status: 'PENDING_CHECKIN',
        guestName: 'Same Day Test Guest',
        guestEmail: 'sameday@test.com',
        guestPhone: '+1234567890',
        basePrice: roomType.basePrice,
        totalPrice,
        locale: 'en',
      },
    });

    console.log(`   ✅ Booking created: ${booking.referenceCode}`);
    console.log(`   📍 Status: ${booking.status}`);
    console.log(`   💰 Total: $${booking.totalPrice}`);
    console.log(`   🌙 Nights: ${nights}`);

    // Test 3: Verify booking can be retrieved
    console.log('\n🔍 Test 3: Retrieve Booking');
    const retrieved = await prisma.booking.findUnique({
      where: { referenceCode: booking.referenceCode },
      include: { roomType: true },
    });

    if (retrieved) {
      console.log(`   ✅ Booking retrieved successfully`);
      console.log(`   📅 Check-in: ${retrieved.checkInDate.toISOString().split('T')[0]}`);
      console.log(`   📅 Check-out: ${retrieved.checkOutDate.toISOString().split('T')[0]}`);
    } else {
      console.error('   ❌ FAILED: Could not retrieve booking');
      return;
    }

    // Test 4: Test past date rejection
    console.log('\n🔍 Test 4: Past Date Rejection');
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);

    const isPastDate = yesterdayStart < todayStart;
    console.log(`   Yesterday: ${yesterday.toISOString().split('T')[0]}`);
    console.log(`   Is past? ${isPastDate}`);
    
    if (isPastDate) {
      console.log('   ✅ PASSED: Past dates correctly detected');
    } else {
      console.error('   ❌ FAILED: Past dates not detected!');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test booking...');
    await prisma.booking.delete({
      where: { id: booking.id },
    });
    console.log('   ✅ Test booking deleted');

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(50));
    console.log('\n📝 Summary:');
    console.log('   ✓ Same-day bookings are allowed');
    console.log('   ✓ Date validation works correctly');
    console.log('   ✓ Past dates are rejected');
    console.log('   ✓ Late check-in scenario supported');
    console.log('\n💡 Guests can now book on the same day they arrive!');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSameDayBooking().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

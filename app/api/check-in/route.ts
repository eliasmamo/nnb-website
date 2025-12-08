import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { issueLockKey } from '@/app/lib/lock-key-service';
import { sendCheckInCompleted } from '@/app/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referenceCode, guestDetails, additionalServices } = body;

    if (!referenceCode || !guestDetails) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { referenceCode },
      include: {
        roomType: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking is eligible for check-in
    if (booking.status !== 'PENDING_CHECKIN') {
      return NextResponse.json(
        { error: 'Booking is not eligible for check-in' },
        { status: 400 }
      );
    }

    // Find an available room of the booked type (not currently assigned to an active booking)
    const availableRoom = await prisma.room.findFirst({
      where: {
        roomTypeId: booking.roomTypeId,
        isActive: true,
        bookings: {
          none: {
            status: {
              in: ['CHECKED_IN', 'PENDING_CHECKIN'],
            },
          },
        },
      },
    });

    if (!availableRoom) {
      return NextResponse.json(
        { error: 'No rooms available at this time. Please contact reception.' },
        { status: 400 }
      );
    }

    // Update booking with room assignment and status to CHECKIN_COMPLETED
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        roomId: availableRoom.id,
        status: 'CHECKIN_COMPLETED',
      },
      include: {
        room: true,
        roomType: true,
      },
    });

    // Create check-in info record
    await prisma.checkInInfo.create({
      data: {
        bookingId: booking.id,
        legalName: booking.guestName,
        dateOfBirth: new Date(guestDetails.passportIssueDate), // Using issue date as placeholder
        passportNumber: guestDetails.passportNumber,
        nationality: guestDetails.nationality,
        address: null,
        additionalServices: {
          services: additionalServices || [],
          estimatedArrivalTime: guestDetails.estimatedArrivalTime,
          specialRequests: guestDetails.specialRequests || '',
        },
      },
    });

    // Issue lock key for the room
    let lockKeyInfo = null;
    try {
      const lockKeyResult = await issueLockKey(booking.id);
      if (lockKeyResult.success && lockKeyResult.lockKey) {
        lockKeyInfo = lockKeyResult.lockKey;
        console.log('🔑 Lock key issued:', lockKeyInfo.pinCode);
      } else {
        console.warn('⚠️ Failed to issue lock key:', lockKeyResult.error);
      }
    } catch (error) {
      console.error('❌ Error issuing lock key:', error);
      // Don't fail the check-in if lock key issuance fails
    }

    // Send check-in completion email with PIN code
    if (lockKeyInfo) {
      try {
        await sendCheckInCompleted({
          to: booking.guestEmail,
          guestName: booking.guestName,
          referenceCode: booking.referenceCode,
          roomNumber: availableRoom.roomNumber,
          pinCode: lockKeyInfo.pinCode,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
        });

        // Log successful email
        await prisma.communicationLog.create({
          data: {
            bookingId: booking.id,
            channel: 'EMAIL',
            type: 'CHECKIN_COMPLETED',
            recipient: booking.guestEmail,
            status: 'SENT',
            payload: {
              roomNumber: availableRoom.roomNumber,
              referenceCode: booking.referenceCode,
              pinCode: lockKeyInfo.pinCode,
            },
          },
        });
      } catch (emailError) {
        console.error('Failed to send check-in email:', emailError);
        // Log failed email but don't fail the check-in
        await prisma.communicationLog.create({
          data: {
            bookingId: booking.id,
            channel: 'EMAIL',
            type: 'CHECKIN_COMPLETED',
            recipient: booking.guestEmail,
            status: 'FAILED',
            payload: {
              error: emailError instanceof Error ? emailError.message : 'Unknown error',
            },
          },
        });
      }
    }

    console.log('✅ Check-in completed for booking:', referenceCode);
    console.log('📍 Room assigned:', availableRoom.roomNumber);
    if (lockKeyInfo) {
      console.log('🔑 PIN code:', lockKeyInfo.pinCode);
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      room: availableRoom,
      lockKey: lockKeyInfo,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Failed to process check-in' },
      { status: 500 }
    );
  }
}

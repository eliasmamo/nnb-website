import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Update booking with room assignment and status
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        roomId: availableRoom.id,
        status: 'CHECKED_IN',
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

    // Log communication for check-in confirmation
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
        },
      },
    });

    console.log('✅ Check-in completed for booking:', referenceCode);
    console.log('📍 Room assigned:', availableRoom.roomNumber);

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      room: availableRoom,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Failed to process check-in' },
      { status: 500 }
    );
  }
}

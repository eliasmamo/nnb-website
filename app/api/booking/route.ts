import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBookingReference } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomTypeId, checkInDate, checkOutDate, guestName, guestEmail, guestPhone } = body;

    // Validate required fields
    if (!roomTypeId || !checkInDate || !checkOutDate || !guestName || !guestEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Validate dates
    if (checkIn >= checkOut) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      );
    }

    if (checkIn < new Date()) {
      return NextResponse.json(
        { error: 'Check-in date cannot be in the past' },
        { status: 400 }
      );
    }

    // Get room type
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
    });

    if (!roomType || !roomType.isActive) {
      return NextResponse.json(
        { error: 'Room type not found or not available' },
        { status: 404 }
      );
    }

    // Calculate nights and price
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const basePrice = Number(roomType.basePrice);
    const totalPrice = basePrice * nights;

    // Generate unique reference code
    let referenceCode = generateBookingReference();
    let exists = await prisma.booking.findUnique({ where: { referenceCode } });
    
    while (exists) {
      referenceCode = generateBookingReference();
      exists = await prisma.booking.findUnique({ where: { referenceCode } });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        referenceCode,
        roomTypeId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        status: 'PENDING_CHECKIN',
        guestName,
        guestEmail,
        guestPhone: guestPhone || null,
        basePrice,
        totalPrice,
        locale: 'en',
      },
      include: {
        roomType: true,
      },
    });

    // TODO: Send confirmation email/WhatsApp (mocked for now)
    console.log('📧 Booking confirmation would be sent to:', guestEmail);
    console.log('📱 WhatsApp notification would be sent to:', guestPhone);

    return NextResponse.json({
      success: true,
      referenceCode: booking.referenceCode,
      booking: {
        id: booking.id,
        referenceCode: booking.referenceCode,
        roomType: booking.roomType.name,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        totalPrice: booking.totalPrice,
        nights,
      },
    });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const referenceCode = searchParams.get('ref');

    if (!referenceCode) {
      return NextResponse.json(
        { error: 'Reference code required' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { referenceCode },
      include: {
        roomType: true,
        room: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Booking lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve booking' },
      { status: 500 }
    );
  }
}
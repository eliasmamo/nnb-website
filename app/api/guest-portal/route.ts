import { NextRequest, NextResponse } from 'next/server';
import { verifyGuestToken } from '@/app/lib/guest-auth';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      );
    }

    // Verify token and get guest session
    const session = await verifyGuestToken(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Fetch complete booking details
    const booking = await prisma.booking.findUnique({
      where: { id: session.bookingId },
      include: {
        room: true,
        lockKeys: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!booking || !booking.room) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const lockKey = booking.lockKeys[0];

    if (!lockKey) {
      return NextResponse.json(
        { error: 'No active lock key found' },
        { status: 404 }
      );
    }

    // Format dates for display
    const formatDateTime = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
    };

    return NextResponse.json({
      success: true,
      data: {
        guestName: booking.guestName,
        roomNumber: booking.room.roomNumber,
        pinCode: lockKey.pinCode,
        checkInDate: formatDate(booking.checkInDate),
        checkOutDate: formatDate(booking.checkOutDate),
        validFrom: formatDateTime(lockKey.validFrom),
        validTo: formatDateTime(lockKey.validTo),
        referenceCode: booking.referenceCode,
      },
    });
  } catch (error) {
    console.error('Guest portal error:', error);
    return NextResponse.json(
      { error: 'Failed to load portal data' },
      { status: 500 }
    );
  }
}

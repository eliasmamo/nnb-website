import { NextRequest, NextResponse } from 'next/server';
import { verifyGuestToken } from '@/app/lib/guest-auth';
import { prisma } from '@/lib/prisma';
import { getTTLockClient } from '@/app/lib/ttlock';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      );
    }

    // Verify guest token
    const session = await verifyGuestToken(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get booking with room
    const booking = await prisma.booking.findUnique({
      where: { id: session.bookingId },
      include: { room: true },
    });

    if (!booking || !booking.room || !booking.room.ttlockLockId) {
      return NextResponse.json(
        { error: 'Room lock not found' },
        { status: 404 }
      );
    }

    // Unlock the door
    const ttlock = getTTLockClient();
    await ttlock.unlockLock(booking.room.ttlockLockId);

    // Log the unlock action
    await prisma.communicationLog.create({
      data: {
        bookingId: booking.id,
        channel: 'EMAIL', // Using EMAIL as closest match
        type: 'BOOKING_CONFIRMATION', // Using existing type
        recipient: booking.guestEmail,
        status: 'SENT',
        payload: {
          action: 'REMOTE_UNLOCK',
          lockId: booking.room.ttlockLockId,
          roomNumber: booking.room.roomNumber,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Door unlocked successfully',
    });
  } catch (error) {
    console.error('Unlock error:', error);
    return NextResponse.json(
      { error: 'Failed to unlock door' },
      { status: 500 }
    );
  }
}

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

    // Get booking with room and lock key
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

    if (!booking || !booking.room || !booking.room.ttlockLockId) {
      return NextResponse.json(
        { error: 'Room lock not found' },
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

    // Send eKey to guest's TTLock app
    const ttlock = getTTLockClient();
    const result = await ttlock.sendEKey({
      lockId: booking.room.ttlockLockId,
      receiverUsername: booking.guestEmail,
      startDate: lockKey.validFrom.getTime(),
      endDate: lockKey.validTo.getTime(),
      remarks: `Room ${booking.room.roomNumber} - ${booking.guestName}`,
    });

    // Log the eKey send
    await prisma.communicationLog.create({
      data: {
        bookingId: booking.id,
        channel: 'EMAIL',
        type: 'BOOKING_CONFIRMATION',
        recipient: booking.guestEmail,
        status: 'SENT',
        payload: {
          action: 'EKEY_SENT',
          keyId: result.keyId,
          lockId: booking.room.ttlockLockId,
          roomNumber: booking.room.roomNumber,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'eKey sent to your TTLock app',
      keyId: result.keyId,
    });
  } catch (error) {
    console.error('eKey send error:', error);
    
    // Check if it's a TTLock API error
    const errorMessage = error instanceof Error ? error.message : 'Failed to send eKey';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        hint: 'Make sure you have the TTLock app installed and registered with this email address'
      },
      { status: 500 }
    );
  }
}

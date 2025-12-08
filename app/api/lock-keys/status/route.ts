/**
 * API endpoint to get lock key status for a booking
 * GET /api/lock-keys/status?bookingId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveLockKey } from '@/app/lib/lock-key-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const lockKey = await getActiveLockKey(bookingId);

    if (!lockKey) {
      return NextResponse.json({
        hasActiveKey: false,
      });
    }

    return NextResponse.json({
      hasActiveKey: true,
      lockKey: {
        id: lockKey.id,
        pinCode: lockKey.pinCode,
        roomNumber: lockKey.room.roomNumber,
        validFrom: lockKey.validFrom,
        validTo: lockKey.validTo,
        status: lockKey.status,
      },
    });
  } catch (error) {
    console.error('Error in lock-keys/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

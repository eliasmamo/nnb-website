/**
 * API endpoint to issue lock keys for a booking
 * POST /api/lock-keys/issue
 */

import { NextRequest, NextResponse } from 'next/server';
import { issueLockKey } from '@/app/lib/lock-key-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const result = await issueLockKey(bookingId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      lockKey: result.lockKey,
    });
  } catch (error) {
    console.error('Error in lock-keys/issue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

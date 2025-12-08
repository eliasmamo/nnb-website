/**
 * API endpoint to revoke lock keys for a booking
 * POST /api/lock-keys/revoke
 */

import { NextRequest, NextResponse } from 'next/server';
import { revokeLockKeys } from '@/app/lib/lock-key-service';

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

    const result = await revokeLockKeys(bookingId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lock keys revoked successfully',
    });
  } catch (error) {
    console.error('Error in lock-keys/revoke:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

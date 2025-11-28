import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    const roomTypeCount = await prisma.roomType.count();
    const roomCount = await prisma.room.count();
    const bookingCount = await prisma.booking.count();
    const adminCount = await prisma.adminUser.count();

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      data: {
        roomTypes: roomTypeCount,
        rooms: roomCount,
        bookings: bookingCount,
        admins: adminCount,
      },
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkInDate, checkOutDate, guests } = body;

    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: 'Check-in and check-out dates are required' },
        { status: 400 }
      );
    }

    // Get all active room types
    const roomTypes = await prisma.roomType.findMany({
      where: {
        isActive: true,
        maxOccupancy: {
          gte: guests || 1,
        },
      },
      orderBy: {
        basePrice: 'asc',
      },
    });

    // For each room type, check availability
    // [Inference] This is a simplified availability check
    // In production, you'd check for overlapping bookings
    const availableRoomTypes = roomTypes.map((roomType) => ({
      id: roomType.id,
      name: roomType.name,
      description: roomType.description,
      basePrice: Number(roomType.basePrice),
      maxOccupancy: roomType.maxOccupancy,
    }));

    return NextResponse.json({
      success: true,
      roomTypes: availableRoomTypes,
    });
  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
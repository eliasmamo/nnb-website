import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const services = await prisma.additionalService.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    // Map service codes to readable names and descriptions
    const serviceDetails: Record<string, { name: string; description: string; unit: string }> = {
      'AIRPORT_TRANSFER': {
        name: 'Airport Transfer',
        description: 'Comfortable transfer from/to airport',
        unit: 'trip',
      },
      'BREAKFAST': {
        name: 'Daily Breakfast',
        description: 'Continental breakfast buffet',
        unit: 'day',
      },
      'LATE_CHECKOUT': {
        name: 'Late Check-out',
        description: 'Extend your stay until 6:00 PM',
        unit: 'booking',
      },
      'PARKING': {
        name: 'Parking Space',
        description: 'Secure parking spot',
        unit: 'day',
      },
      'LAUNDRY': {
        name: 'Laundry Service',
        description: 'Professional laundry service',
        unit: 'load',
      },
    };

    const enrichedServices = services.map(service => ({
      id: service.id,
      code: service.code,
      name: serviceDetails[service.code]?.name || service.code,
      description: serviceDetails[service.code]?.description || '',
      unit: serviceDetails[service.code]?.unit || 'item',
      price: service.price,
      isActive: service.isActive,
    }));

    return NextResponse.json({ services: enrichedServices });
  } catch (error) {
    console.error('Services fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Users } from 'lucide-react';

export default async function RoomsPage() {
  const roomTypes = await prisma.roomType.findMany({
    where: { isActive: true },
    orderBy: { basePrice: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">Our Rooms</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from our selection of comfortable and well-appointed rooms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {roomTypes.map((roomType) => (
            <Card key={roomType.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{roomType.name}</CardTitle>
                <CardDescription>{roomType.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    Up to {roomType.maxOccupancy} guests
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(Number(roomType.basePrice))}
                    <span className="text-sm font-normal text-muted-foreground">/night</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {roomType.totalUnits} rooms available
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/booking?roomType=${roomType.id}`} className="w-full">
                  <Button className="w-full">Book Now</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
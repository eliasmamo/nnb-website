'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Mail, Phone, Home } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const referenceCode = searchParams.get('ref');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!referenceCode) {
      setError('No reference code provided');
      setLoading(false);
      return;
    }

    fetch(`/api/booking?ref=${referenceCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setBooking(data.booking);
        }
      })
      .catch(() => setError('Failed to load booking'))
      .finally(() => setLoading(false));
  }, [referenceCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Booking Not Found</CardTitle>
            <CardDescription>{error || 'Unable to find your booking'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/rooms')}>Back to Rooms</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nights = Math.ceil(
    (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground">Your reservation has been successfully created</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Reference Code: {booking.referenceCode}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Room Info */}
            <div>
              <h3 className="font-semibold mb-2">Room</h3>
              <p className="text-lg">{booking.roomType.name}</p>
              <p className="text-sm text-muted-foreground">{booking.roomType.description}</p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Check-in
                </h3>
                <p>{formatDate(new Date(booking.checkInDate))}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Check-out
                </h3>
                <p>{formatDate(new Date(booking.checkOutDate))}</p>
              </div>
            </div>

            {/* Guest Info */}
            <div>
              <h3 className="font-semibold mb-2">Guest Information</h3>
              <div className="space-y-1 text-sm">
                <p>{booking.guestName}</p>
                <p className="flex items-center text-muted-foreground">
                  <Mail className="w-4 h-4 mr-2" />
                  {booking.guestEmail}
                </p>
                {booking.guestPhone && (
                  <p className="flex items-center text-muted-foreground">
                    <Phone className="w-4 h-4 mr-2" />
                    {booking.guestPhone}
                  </p>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">{nights} night(s)</span>
                <span>{formatCurrency(Number(booking.basePrice))} × {nights}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(Number(booking.totalPrice))}</span>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What&apos;s Next?</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Confirmation email sent to {booking.guestEmail}</li>
                <li>✓ You&apos;ll receive check-in instructions 24 hours before arrival</li>
                <li>✓ Save your reference code: <strong className="text-foreground">{booking.referenceCode}</strong></li>
              </ul>
            </div>

            <Button onClick={() => router.push('/')} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
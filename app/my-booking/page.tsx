'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Calendar, Mail, Phone, User, MapPin, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function MyBookingPage() {
  const [referenceCode, setReferenceCode] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBooking(null);

    try {
      const response = await fetch(`/api/booking?ref=${referenceCode}`);
      const data = await response.json();

      if (response.ok) {
        setBooking(data.booking);
      } else {
        setError(data.error || 'Booking not found');
      }
    } catch (err) {
      setError('Failed to retrieve booking');
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!booking) return 0;
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const canCheckIn = () => {
    if (!booking) return false;
    const now = new Date();
    const checkInDate = new Date(booking.checkInDate);
    const dayBefore = new Date(checkInDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    return now >= dayBefore && booking.status === 'PENDING_CHECKIN';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find Your Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reference">
                  <Search className="w-4 h-4 inline mr-2" />
                  Booking Reference Code
                </Label>
                <Input
                  id="reference"
                  placeholder="Enter your 6-character code (e.g., ABC123)"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Searching...' : 'Find Booking'}
              </Button>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {booking && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Booking Details</CardTitle>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  booking.status === 'CHECKED_IN' ? 'bg-green-100 text-green-800' :
                  booking.status === 'CHECKED_OUT' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Reference Code */}
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Reference Code</p>
                <p className="text-3xl font-bold text-primary">{booking.referenceCode}</p>
              </div>

              {/* Room Info */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Room Information
                </h3>
                <p className="text-lg">{booking.roomType.name}</p>
                <p className="text-sm text-muted-foreground">{booking.roomType.description}</p>
                {booking.room && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Room Number: <strong>{booking.room.roomNumber}</strong>
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Check-in
                  </h3>
                  <p>{formatDate(new Date(booking.checkInDate))}</p>
                  <p className="text-sm text-muted-foreground">After 2:00 PM</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Check-out
                  </h3>
                  <p>{formatDate(new Date(booking.checkOutDate))}</p>
                  <p className="text-sm text-muted-foreground">Before 11:00 AM</p>
                </div>
              </div>

              {/* Guest Info */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Guest Information
                </h3>
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
                  <span className="text-muted-foreground">{calculateNights()} night(s)</span>
                  <span>{formatCurrency(Number(booking.basePrice))} × {calculateNights()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Paid</span>
                  <span className="text-primary">{formatCurrency(Number(booking.totalPrice))}</span>
                </div>
              </div>

              {/* Check-in Button */}
              {canCheckIn() && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800 mb-3">
                    ✓ Online check-in is now available!
                  </p>
                  <Link href={`/check-in?ref=${booking.referenceCode}`}>
                    <Button className="w-full">
                      Start Online Check-in
                    </Button>
                  </Link>
                </div>
              )}

              {booking.status === 'CHECKED_IN' && (
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-blue-800">
                    You&apos;re checked in! Enjoy your stay at N&B Hotel.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
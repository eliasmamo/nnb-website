'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Users, Mail, Phone } from 'lucide-react';

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomTypeId = searchParams.get('roomType');

  const [formData, setFormData] = useState({
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    guestName: '',
    guestEmail: '',
    guestPhone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId,
          checkInDate: formData.checkInDate,
          checkOutDate: formData.checkOutDate,
          guestName: formData.guestName,
          guestEmail: formData.guestEmail,
          guestPhone: formData.guestPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      // Redirect to confirmation page
      router.push(`/booking/confirmation?ref=${data.referenceCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!roomTypeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Request</CardTitle>
            <CardDescription>Please select a room type first</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/rooms')}>View Rooms</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Booking</CardTitle>
            <CardDescription>Fill in your details to reserve your room</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkInDate">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Check-in Date
                  </Label>
                  <Input
                    id="checkInDate"
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOutDate">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Check-out Date
                  </Label>
                  <Input
                    id="checkOutDate"
                    type="date"
                    required
                    min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                    value={formData.checkOutDate}
                    onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Guest Info */}
              <div className="space-y-2">
                <Label htmlFor="guestName">Full Name</Label>
                <Input
                  id="guestName"
                  required
                  placeholder="John Doe"
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestEmail">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="guestEmail"
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={formData.guestEmail}
                  onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestPhone">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone (optional)
                </Label>
                <Input
                  id="guestPhone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.guestPhone}
                  onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => router.push('/rooms')} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Processing...' : 'Confirm Booking'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
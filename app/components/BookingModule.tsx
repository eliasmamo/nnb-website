'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Users, Search, Mail, Phone, User, CreditCard, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type BookingStep = 'search' | 'rooms' | 'details' | 'payment' | 'success';

interface RoomType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  maxOccupancy: number;
  image: string;
}

export default function BookingModule() {
  const [step, setStep] = useState<BookingStep>('search');
  const [searchParams, setSearchParams] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
  });
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [availableRooms, setAvailableRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingReference, setBookingReference] = useState('');

  const handleSearch = async () => {
    if (!searchParams.checkIn || !searchParams.checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAvailableRooms([
        {
          id: '1',
          name: 'Standard Room',
          description: 'Comfortable room with essential amenities, perfect for solo travelers or couples',
          basePrice: 80,
          maxOccupancy: 2,
          image: 'bg-blue-200',
        },
        {
          id: '2',
          name: 'Deluxe Room',
          description: 'Spacious room with premium amenities, dedicated workspace, and city view',
          basePrice: 120,
          maxOccupancy: 3,
          image: 'bg-green-200',
        },
        {
          id: '3',
          name: 'Suite',
          description: 'Luxurious suite with separate living area, balcony, and premium workspace',
          basePrice: 200,
          maxOccupancy: 4,
          image: 'bg-purple-200',
        },
      ]);
      setStep('rooms');
      setLoading(false);
    }, 1000);
  };

  const handleRoomSelect = (room: RoomType) => {
    setSelectedRoom(room);
    setStep('details');
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setBookingReference('NNB' + Math.random().toString(36).substr(2, 6).toUpperCase());
      setStep('success');
      setLoading(false);
    }, 2000);
  };

  const calculateNights = () => {
    if (!searchParams.checkIn || !searchParams.checkOut) return 0;
    const checkIn = new Date(searchParams.checkIn);
    const checkOut = new Date(searchParams.checkOut);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!selectedRoom) return 0;
    return selectedRoom.basePrice * calculateNights();
  };

  return (
    <section id="booking" className="py-16 bg-gradient-to-b from-white to-neutral-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2">Book Your Stay</h2>
            <p className="text-muted-foreground">Find the perfect room for your needs</p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-6 md:p-8">
              {/* Search Form - Always Visible */}
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn" className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Check-in
                    </Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={searchParams.checkIn}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSearchParams({ ...searchParams, checkIn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOut" className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Check-out
                    </Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={searchParams.checkOut}
                      min={searchParams.checkIn || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSearchParams({ ...searchParams, checkOut: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guests" className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Guests
                    </Label>
                    <Input
                      id="guests"
                      type="number"
                      min="1"
                      max="4"
                      value={searchParams.guests}
                      onChange={(e) => setSearchParams({ ...searchParams, guests: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleSearch} disabled={loading} className="w-full">
                      <Search className="w-4 h-4 mr-2" />
                      {loading ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Available Rooms */}
              {step === 'rooms' && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <h3 className="text-xl font-semibold mb-4">Available Rooms</h3>
                  {availableRooms.map((room) => (
                    <Card key={room.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className={`relative h-48 md:h-auto ${room.image} flex items-center justify-center`}>
                          <span className="text-4xl font-bold text-white/50">{room.name.split(' ')[0]}</span>
                        </div>
                        <div className="p-4 md:col-span-2 flex flex-col justify-between">
                          <div>
                            <h4 className="text-lg font-semibold mb-2">{room.name}</h4>
                            <p className="text-sm text-muted-foreground mb-3">{room.description}</p>
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <Users className="w-4 h-4 mr-2" />
                              Up to {room.maxOccupancy} guests
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div>
                              <span className="text-2xl font-bold text-primary">
                                {formatCurrency(room.basePrice)}
                              </span>
                              <span className="text-sm text-muted-foreground">/night</span>
                              <div className="text-sm text-muted-foreground">
                                {calculateNights()} nights = {formatCurrency(room.basePrice * calculateNights())}
                              </div>
                            </div>
                            <Button onClick={() => handleRoomSelect(room)}>
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Guest Details Form */}
              {step === 'details' && selectedRoom && (
                <div className="animate-in fade-in duration-500">
                  <h3 className="text-xl font-semibold mb-4">Guest Details</h3>
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{selectedRoom.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(searchParams.checkIn).toLocaleDateString()} - {new Date(searchParams.checkOut).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(calculateTotal())}</p>
                        <p className="text-sm text-muted-foreground">{calculateNights()} nights</p>
                      </div>
                    </div>
                  </div>
                  <form onSubmit={handleDetailsSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        <User className="w-4 h-4 inline mr-2" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        required
                        value={guestDetails.name}
                        onChange={(e) => setGuestDetails({ ...guestDetails, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={guestDetails.email}
                        onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={guestDetails.phone}
                        onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>
                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={() => setStep('rooms')} className="flex-1">
                        Back
                      </Button>
                      <Button type="submit" className="flex-1">
                        Continue to Payment
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Payment Form */}
              {step === 'payment' && (
                <div className="animate-in fade-in duration-500">
                  <h3 className="text-xl font-semibold mb-4">Payment Details</h3>
                  <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Room:</span>
                        <span className="font-semibold">{selectedRoom?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Guest:</span>
                        <span className="font-semibold">{guestDetails.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dates:</span>
                        <span className="font-semibold">
                          {new Date(searchParams.checkIn).toLocaleDateString()} - {new Date(searchParams.checkOut).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-semibold">Total:</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>
                  <form onSubmit={handlePayment} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">
                        <CreditCard className="w-4 h-4 inline mr-2" />
                        Card Number
                      </Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input
                          id="expiry"
                          placeholder="MM/YY"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          maxLength={3}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={() => setStep('details')} className="flex-1">
                        Back
                      </Button>
                      <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? 'Processing...' : `Pay ${formatCurrency(calculateTotal())}`}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Success Message */}
              {step === 'success' && (
                <div className="text-center py-8 animate-in fade-in duration-500">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-primary mb-2">Booking Confirmed!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your booking has been successfully processed
                  </p>
                  <div className="bg-muted/50 p-6 rounded-lg max-w-md mx-auto mb-6">
                    <p className="text-sm text-muted-foreground mb-2">Booking Reference</p>
                    <p className="text-3xl font-bold text-primary mb-4">{bookingReference}</p>
                    <p className="text-sm text-muted-foreground">
                      Confirmation details have been sent to <strong>{guestDetails.email}</strong>
                    </p>
                  </div>
                  <Button onClick={() => {
                    setStep('search');
                    setSearchParams({ checkIn: '', checkOut: '', guests: 1 });
                    setSelectedRoom(null);
                    setGuestDetails({ name: '', email: '', phone: '' });
                  }}>
                    Make Another Booking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
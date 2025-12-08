'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, MapPin, FileText, CreditCard, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function CheckInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const referenceCode = searchParams.get('ref');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'verify' | 'details' | 'services' | 'success'>('verify');

  const [guestDetails, setGuestDetails] = useState({
    nationality: '',
    passportNumber: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    estimatedArrivalTime: '',
    specialRequests: '',
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]);

  useEffect(() => {
    if (referenceCode) {
      fetchBooking();
      fetchServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceCode]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/booking?ref=${referenceCode}`);
      const data = await response.json();

      if (response.ok) {
        setBooking(data.booking);
        
        // Check if already checked in
        if (data.booking.status === 'CHECKED_IN') {
          setStep('success');
        } else if (data.booking.status !== 'PENDING_CHECKIN') {
          setError('This booking is not eligible for check-in');
        } else {
          // Booking is valid, proceed to details step
          setStep('details');
        }
      } else {
        setError(data.error || 'Booking not found');
      }
    } catch (err) {
      setError('Failed to retrieve booking');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      if (response.ok) {
        setAvailableServices(data.services);
      }
    } catch (err) {
      console.error('Failed to fetch services');
    }
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('services');
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleCheckIn = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceCode,
          guestDetails,
          additionalServices: selectedServices,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
      } else {
        setError(data.error || 'Check-in failed');
        setSubmitting(false);
      }
    } catch (err) {
      setError('Failed to process check-in');
      setSubmitting(false);
    }
  };

  const calculateNights = () => {
    if (!booking) return 0;
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!booking) return 0;
    const bookingTotal = Number(booking.totalPrice);
    const servicesTotal = selectedServices.reduce((sum, serviceId) => {
      const service = availableServices.find(s => s.id === serviceId);
      return sum + (service ? Number(service.price) : 0);
    }, 0);
    return bookingTotal + servicesTotal;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 py-12 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Link href="/my-booking">
                  <Button variant="outline">Back to My Booking</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <Link href={`/my-booking?ref=${referenceCode}`} className="text-primary hover:underline">
            ← Back to Booking Details
          </Link>
        </div>

        {/* Progress Indicator */}
        {step !== 'success' && (
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center ${step === 'details' || step === 'services' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'details' || step === 'services' ? 'bg-primary text-white' : 'bg-muted'}`}>
                  1
                </div>
                <span className="ml-2 text-sm">Guest Details</span>
              </div>
              <div className="w-12 h-0.5 bg-muted"></div>
              <div className={`flex items-center ${step === 'services' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'services' ? 'bg-primary text-white' : 'bg-muted'}`}>
                  2
                </div>
                <span className="ml-2 text-sm">Additional Services</span>
              </div>
            </div>
          </div>
        )}

        {/* Booking Summary */}
        {booking && step !== 'success' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Your Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Reference Code</p>
                  <p className="font-bold text-primary">{booking.referenceCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Room Type</p>
                  <p className="font-semibold">{booking.roomType.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-in</p>
                  <p className="font-semibold">{formatDate(new Date(booking.checkInDate))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-out</p>
                  <p className="font-semibold">{formatDate(new Date(booking.checkOutDate))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Guest Details */}
        {step === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle>Guest Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Please provide your travel document details for registration
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nationality">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Nationality *
                    </Label>
                    <Input
                      id="nationality"
                      placeholder="e.g., Moldova, Romania, USA"
                      value={guestDetails.nationality}
                      onChange={(e) => setGuestDetails({ ...guestDetails, nationality: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passportNumber">
                      <CreditCard className="w-4 h-4 inline mr-2" />
                      Passport/ID Number *
                    </Label>
                    <Input
                      id="passportNumber"
                      placeholder="Passport or ID number"
                      value={guestDetails.passportNumber}
                      onChange={(e) => setGuestDetails({ ...guestDetails, passportNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passportIssueDate">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Issue Date *
                    </Label>
                    <Input
                      id="passportIssueDate"
                      type="date"
                      value={guestDetails.passportIssueDate}
                      onChange={(e) => setGuestDetails({ ...guestDetails, passportIssueDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passportExpiryDate">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Expiry Date *
                    </Label>
                    <Input
                      id="passportExpiryDate"
                      type="date"
                      value={guestDetails.passportExpiryDate}
                      onChange={(e) => setGuestDetails({ ...guestDetails, passportExpiryDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Estimated Arrival Time *
                  </Label>
                  <Input
                    id="arrivalTime"
                    type="time"
                    value={guestDetails.estimatedArrivalTime}
                    onChange={(e) => setGuestDetails({ ...guestDetails, estimatedArrivalTime: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Check-in is available from 2:00 PM
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialRequests">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Special Requests (Optional)
                  </Label>
                  <textarea
                    id="specialRequests"
                    className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md"
                    placeholder="Any special requests or requirements..."
                    value={guestDetails.specialRequests}
                    onChange={(e) => setGuestDetails({ ...guestDetails, specialRequests: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Continue to Additional Services
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Additional Services */}
        {step === 'services' && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Services</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enhance your stay with our optional services
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {availableServices.length > 0 ? (
                <div className="space-y-3">
                  {availableServices.map((service) => (
                    <div
                      key={service.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedServices.includes(service.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleService(service.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedServices.includes(service.id)}
                              onChange={() => toggleService(service.id)}
                              className="mr-3"
                            />
                            <div>
                              <h4 className="font-semibold">{service.name}</h4>
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-primary">{formatCurrency(Number(service.price))}</p>
                          <p className="text-xs text-muted-foreground">per {service.unit}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No additional services available</p>
              )}

              {/* Total Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Room ({calculateNights()} nights)</span>
                    <span>{formatCurrency(Number(booking.totalPrice))}</span>
                  </div>
                  {selectedServices.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Additional Services</span>
                      <span>
                        {formatCurrency(
                          selectedServices.reduce((sum, serviceId) => {
                            const service = availableServices.find(s => s.id === serviceId);
                            return sum + (service ? Number(service.price) : 0);
                          }, 0)
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('details')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCheckIn}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Processing...' : 'Complete Check-in'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {step === 'success' && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-primary mb-2">Check-in Complete!</h2>
              <p className="text-muted-foreground mb-6">
                You&apos;re all set for your stay at N&B Hotel
              </p>

              <div className="bg-muted/50 p-6 rounded-lg max-w-md mx-auto mb-6">
                <p className="text-sm text-muted-foreground mb-2">Your Room</p>
                <p className="text-2xl font-bold text-primary mb-4">
                  {booking?.room?.roomNumber || 'Will be assigned'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Room access details will be sent to your email shortly
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto mb-6">
                <h3 className="font-semibold mb-2">Next Steps:</h3>
                <ul className="text-sm text-left space-y-1">
                  <li>✓ Check your email for room access instructions</li>
                  <li>✓ Your digital key will be activated at check-in time</li>
                  <li>✓ Visit our front desk if you need any assistance</li>
                </ul>
              </div>

              <Link href="/">
                <Button className="w-full max-w-md">
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

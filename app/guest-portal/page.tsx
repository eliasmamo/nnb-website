'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface GuestPortalData {
  guestName: string;
  roomNumber: string;
  pinCode: string;
  checkInDate: string;
  checkOutDate: string;
  validFrom: string;
  validTo: string;
  referenceCode: string;
}

export default function GuestPortalPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<GuestPortalData | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [sendingEKey, setSendingEKey] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (token) {
      fetchPortalData();
    } else {
      setError('Invalid access link');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchPortalData = async () => {
    try {
      const response = await fetch(`/api/guest-portal?token=${token}`);
      const result = await response.json();

      if (response.ok) {
        setData(result.data);
      } else {
        setError(result.error || 'Access denied');
      }
    } catch (err) {
      setError('Failed to load portal');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!token) return;
    
    setUnlocking(true);
    setActionMessage('');
    
    try {
      const response = await fetch('/api/guest-portal/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (response.ok) {
        setActionMessage('✅ Door unlocked successfully!');
      } else {
        setActionMessage(`❌ ${result.error || 'Failed to unlock'}`);
      }
    } catch (err) {
      setActionMessage('❌ Failed to unlock door');
    } finally {
      setUnlocking(false);
      // Clear message after 5 seconds
      setTimeout(() => setActionMessage(''), 5000);
    }
  };

  const handleSendEKey = async () => {
    if (!token) return;
    
    setSendingEKey(true);
    setActionMessage('');
    
    try {
      const response = await fetch('/api/guest-portal/send-ekey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (response.ok) {
        setActionMessage('✅ eKey sent to your TTLock app! Check your app.');
      } else {
        setActionMessage(`❌ ${result.error || 'Failed to send eKey'}${result.hint ? ` - ${result.hint}` : ''}`);
      }
    } catch (err) {
      setActionMessage('❌ Failed to send eKey');
    } finally {
      setSendingEKey(false);
      // Clear message after 8 seconds
      setTimeout(() => setActionMessage(''), 8000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9c9b77] mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your stay details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-neutral-600 mb-4">
            {error || 'This link is invalid or has expired.'}
          </p>
          <p className="text-sm text-neutral-500">
            Please check your email for the correct link or contact reception.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10">
              <Image
                src="/graphics/nnb-logo.jpeg"
                alt="N&B Hotel"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold">N&B Hotel</h1>
              <p className="text-xs text-neutral-500">Guest Portal</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{data.guestName}</p>
            <p className="text-xs text-neutral-500">Room {data.roomNumber}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-[#9c9b77] to-[#7a7960] text-white rounded-lg p-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-2">Welcome, {data.guestName}! 👋</h2>
          <p className="text-white/90">
            Your stay: {data.checkInDate} - {data.checkOutDate}
          </p>
          <p className="text-sm text-white/80 mt-1">
            Booking Reference: {data.referenceCode}
          </p>
        </div>

        {/* Room Access Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
            <h3 className="text-2xl font-bold flex items-center">
              <span className="mr-2">🔑</span>
              Your Room Access
            </h3>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Room Number */}
              <div className="text-center p-6 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-600 mb-2">Room Number</p>
                <p className="text-5xl font-bold text-[#9c9b77]">{data.roomNumber}</p>
              </div>

              {/* PIN Code */}
              <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-blue-600 font-medium mb-2">Your PIN Code</p>
                <p className="text-5xl font-bold text-blue-600 tracking-widest">{data.pinCode}</p>
                <p className="text-xs text-neutral-600 mt-3">
                  Valid: {data.validFrom} - {data.validTo}
                </p>
              </div>
            </div>

            {/* Remote Actions */}
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {unlocking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Unlocking...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">🔓</span>
                    <span>Unlock Door Now</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSendEKey}
                disabled={sendingEKey}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {sendingEKey ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">📱</span>
                    <span>Send to TTLock App</span>
                  </>
                )}
              </button>
            </div>

            {/* Action Message */}
            {actionMessage && (
              <div className={`mt-4 p-4 rounded-lg text-center font-medium ${
                actionMessage.startsWith('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {actionMessage}
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">How to Access Your Room:</h4>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="font-bold mr-2">1.</span>
                  <span>Go to Room {data.roomNumber}</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">2.</span>
                  <span>Enter PIN: <strong>{data.pinCode}</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">3.</span>
                  <span>Press # or * to unlock</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">4.</span>
                  <span>Door will unlock automatically</span>
                </li>
              </ol>
              <p className="mt-3 text-xs text-blue-700 font-medium">
                💡 Or use the buttons above for remote access!
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="#"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-4xl mb-2">📱</div>
            <h4 className="font-semibold mb-1">TTLock App</h4>
            <p className="text-sm text-neutral-600">Unlock remotely</p>
          </a>

          <a
            href="#"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-4xl mb-2">🛎️</div>
            <h4 className="font-semibold mb-1">Request Service</h4>
            <p className="text-sm text-neutral-600">Housekeeping & more</p>
          </a>

          <a
            href="#"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-4xl mb-2">💬</div>
            <h4 className="font-semibold mb-1">Contact Us</h4>
            <p className="text-sm text-neutral-600">24/7 support</p>
          </a>
        </div>

        {/* Important Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4">Important Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <div>
                <strong>Check-out time:</strong> 11:00 AM on {data.checkOutDate}
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <div>
                <strong>WiFi:</strong> Network name and password available in your room
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <div>
                <strong>PIN expires:</strong> Automatically after checkout
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <div>
                <strong>Need help?</strong> Email info@nnb.hotel or call reception
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-neutral-500">
        <p>This is your personal guest portal. Keep this link private.</p>
        <p className="mt-2">© 2025 N&B Hotel. All rights reserved.</p>
      </div>
    </div>
  );
}

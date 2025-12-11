/**
 * Guest Authentication System
 * Uses JWT tokens for secure, time-limited guest portal access
 */

import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface GuestSession {
  bookingId: string;
  guestEmail: string;
  guestName: string;
  roomNumber: string;
  checkOutDate: Date;
}

/**
 * Generate a magic link token for guest portal access
 * Token is valid until checkout date
 */
export async function generateGuestToken(bookingId: string): Promise<string> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      room: true,
      checkInInfo: true,
    },
  });

  if (!booking || !booking.checkInInfo || !booking.room) {
    throw new Error('Booking not found or not checked in');
  }

  const token = await new SignJWT({
    bookingId: booking.id,
    guestEmail: booking.guestEmail,
    guestName: booking.guestName,
    roomNumber: booking.room.roomNumber,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(booking.checkOutDate) // Token expires at checkout
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode guest token
 * Returns guest session data if valid
 */
export async function verifyGuestToken(token: string): Promise<GuestSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Verify booking still exists and is checked in
    const booking = await prisma.booking.findUnique({
      where: { id: payload.bookingId as string },
      include: {
        room: true,
        checkInInfo: true,
      },
    });

    if (!booking || booking.status !== 'CHECKED_IN' || !booking.room) {
      return null;
    }

    // Check if checkout date has passed
    if (new Date() > booking.checkOutDate) {
      return null;
    }

    return {
      bookingId: booking.id,
      guestEmail: booking.guestEmail,
      guestName: booking.guestName,
      roomNumber: booking.room.roomNumber,
      checkOutDate: booking.checkOutDate,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Generate magic link URL for guest portal
 */
export function generateMagicLink(token: string): string {
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/guest-portal?token=${token}`;
}

/**
 * Create a guest session and return magic link
 */
export async function createGuestSession(bookingId: string): Promise<string> {
  const token = await generateGuestToken(bookingId);
  return generateMagicLink(token);
}

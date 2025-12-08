/**
 * Lock Key Service
 * 
 * Manages the creation, storage, and revocation of lock keys for bookings
 */

import { prisma } from './prisma';
import { createLockKeyForBooking, revokeLockKey } from './ttlock';

interface IssueKeyResult {
  success: boolean;
  lockKey?: {
    id: string;
    pinCode: string;
    roomNumber: string;
    validFrom: Date;
    validTo: Date;
  };
  error?: string;
}

/**
 * Allocate a room for a booking
 * Simple allocation: find first available room of the requested type
 */
async function allocateRoom(bookingId: string, roomTypeId: string): Promise<string | null> {
  // Get booking dates
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { checkInDate: true, checkOutDate: true },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Find rooms of the requested type
  const rooms = await prisma.room.findMany({
    where: {
      roomTypeId,
      isActive: true,
      ttlockLockId: { not: null }, // Must have a lock configured
    },
  });

  if (rooms.length === 0) {
    return null;
  }

  // Check each room for availability
  for (const room of rooms) {
    // Check if room has any overlapping bookings
    const overlappingBookings = await prisma.booking.count({
      where: {
        roomId: room.id,
        status: {
          in: ['CONFIRMED', 'CHECKIN_COMPLETED', 'CHECKED_IN'],
        },
        OR: [
          {
            // Booking starts during our stay
            checkInDate: {
              gte: booking.checkInDate,
              lt: booking.checkOutDate,
            },
          },
          {
            // Booking ends during our stay
            checkOutDate: {
              gt: booking.checkInDate,
              lte: booking.checkOutDate,
            },
          },
          {
            // Booking encompasses our entire stay
            AND: [
              { checkInDate: { lte: booking.checkInDate } },
              { checkOutDate: { gte: booking.checkOutDate } },
            ],
          },
        ],
      },
    });

    if (overlappingBookings === 0) {
      return room.id;
    }
  }

  return null;
}

/**
 * Issue a lock key for a booking after check-in is completed
 */
export async function issueLockKey(bookingId: string): Promise<IssueKeyResult> {
  try {
    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        checkInInfo: true,
        room: true,
        roomType: true,
      },
    });

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    if (!booking.checkInInfo) {
      return { success: false, error: 'Check-in not completed' };
    }

    // Check if key already exists
    const existingKey = await prisma.lockKey.findFirst({
      where: {
        bookingId,
        status: 'ACTIVE',
      },
    });

    if (existingKey) {
      return { success: false, error: 'Active lock key already exists for this booking' };
    }

    // Allocate room if not already assigned
    let roomId = booking.roomId;
    if (!roomId) {
      roomId = await allocateRoom(bookingId, booking.roomTypeId);
      if (!roomId) {
        return { success: false, error: 'No available rooms of the requested type' };
      }

      // Update booking with room assignment
      await prisma.booking.update({
        where: { id: bookingId },
        data: { roomId },
      });
    }

    // Get room details with lock ID
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room || !room.ttlockLockId) {
      return { success: false, error: 'Room does not have a lock configured' };
    }

    // Create passcode via TTLock API
    const { pinCode, remoteId } = await createLockKeyForBooking({
      bookingId,
      roomId: room.id,
      lockId: room.ttlockLockId,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      guestName: booking.checkInInfo.legalName,
    });

    // Calculate validity window
    const validFrom = new Date(booking.checkInDate);
    validFrom.setHours(14, 0, 0, 0); // 2 PM check-in

    const validTo = new Date(booking.checkOutDate);
    validTo.setHours(11, 0, 0, 0); // 11 AM check-out

    // Store key in database
    const lockKey = await prisma.lockKey.create({
      data: {
        bookingId,
        roomId: room.id,
        ttlockLockId: room.ttlockLockId,
        pinCode,
        validFrom,
        validTo,
        status: 'ACTIVE',
        remoteId,
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CHECKED_IN' },
    });

    return {
      success: true,
      lockKey: {
        id: lockKey.id,
        pinCode,
        roomNumber: room.roomNumber,
        validFrom,
        validTo,
      },
    };
  } catch (error) {
    console.error('Error issuing lock key:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Revoke all active lock keys for a booking
 */
export async function revokeLockKeys(bookingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get all active keys for the booking
    const lockKeys = await prisma.lockKey.findMany({
      where: {
        bookingId,
        status: 'ACTIVE',
      },
    });

    if (lockKeys.length === 0) {
      return { success: true }; // Nothing to revoke
    }

    // Revoke each key via TTLock API
    for (const key of lockKeys) {
      if (key.remoteId) {
        try {
          await revokeLockKey(key.ttlockLockId, key.remoteId);
        } catch (error) {
          console.error(`Failed to revoke key ${key.id} via TTLock API:`, error);
          // Continue with other keys even if one fails
        }
      }

      // Update status in database
      await prisma.lockKey.update({
        where: { id: key.id },
        data: { status: 'REVOKED' },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error revoking lock keys:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get active lock key for a booking
 */
export async function getActiveLockKey(bookingId: string) {
  return prisma.lockKey.findFirst({
    where: {
      bookingId,
      status: 'ACTIVE',
    },
    include: {
      room: true,
    },
  });
}

/**
 * Expire old lock keys (run as a scheduled job)
 */
export async function expireOldLockKeys(): Promise<number> {
  const now = new Date();

  const result = await prisma.lockKey.updateMany({
    where: {
      status: 'ACTIVE',
      validTo: { lt: now },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  return result.count;
}

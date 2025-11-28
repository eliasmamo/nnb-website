import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...');
  await prisma.communicationLog.deleteMany();
  await prisma.lockKey.deleteMany();
  await prisma.checkInInfo.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.additionalService.deleteMany();
  await prisma.adminUser.deleteMany();

  // Create Admin User
  console.log('👤 Creating admin user...');
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  const admin = await prisma.adminUser.create({
    data: {
      email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@nnb.hotel',
      passwordHash: hashedPassword,
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create Room Types
  console.log('🏨 Creating room types...');
  const standardRoom = await prisma.roomType.create({
    data: {
      name: 'Standard Room',
      description: 'Comfortable room with essential amenities',
      basePrice: 80.00,
      maxOccupancy: 2,
      totalUnits: 5,
      isActive: true,
    },
  });

  const deluxeRoom = await prisma.roomType.create({
    data: {
      name: 'Deluxe Room',
      description: 'Spacious room with premium amenities and city view',
      basePrice: 120.00,
      maxOccupancy: 3,
      totalUnits: 3,
      isActive: true,
    },
  });

  const suite = await prisma.roomType.create({
    data: {
      name: 'Suite',
      description: 'Luxurious suite with separate living area and balcony',
      basePrice: 200.00,
      maxOccupancy: 4,
      totalUnits: 2,
      isActive: true,
    },
  });
  console.log('✅ Room types created');

  // Create Physical Rooms
  console.log('🚪 Creating physical rooms...');
  const rooms = [
    // Standard Rooms (101-105)
    { roomNumber: '101', roomTypeId: standardRoom.id, ttlockLockId: 'LOCK_101' },
    { roomNumber: '102', roomTypeId: standardRoom.id, ttlockLockId: 'LOCK_102' },
    { roomNumber: '103', roomTypeId: standardRoom.id, ttlockLockId: 'LOCK_103' },
    { roomNumber: '104', roomTypeId: standardRoom.id, ttlockLockId: 'LOCK_104' },
    { roomNumber: '105', roomTypeId: standardRoom.id, ttlockLockId: 'LOCK_105' },
    
    // Deluxe Rooms (201-203)
    { roomNumber: '201', roomTypeId: deluxeRoom.id, ttlockLockId: 'LOCK_201' },
    { roomNumber: '202', roomTypeId: deluxeRoom.id, ttlockLockId: 'LOCK_202' },
    { roomNumber: '203', roomTypeId: deluxeRoom.id, ttlockLockId: 'LOCK_203' },
    
    // Suites (301-302)
    { roomNumber: '301', roomTypeId: suite.id, ttlockLockId: 'LOCK_301' },
    { roomNumber: '302', roomTypeId: suite.id, ttlockLockId: 'LOCK_302' },
  ];

  for (const room of rooms) {
    await prisma.room.create({ data: room });
  }
  console.log(`✅ Created ${rooms.length} physical rooms`);

  // Create Additional Services
  console.log('🛎️  Creating additional services...');
  const services = [
    { code: 'EARLY_CHECKIN', price: 20.00 },
    { code: 'LATE_CHECKOUT', price: 25.00 },
    { code: 'AIRPORT_TRANSFER', price: 50.00 },
    { code: 'COWORKING_DAY_PASS', price: 15.00 },
    { code: 'BREAKFAST', price: 12.00 },
  ];

  for (const service of services) {
    await prisma.additionalService.create({ data: service });
  }
  console.log(`✅ Created ${services.length} additional services`);

  // Create Demo Booking
  console.log('📅 Creating demo booking...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 8);

  const demoBooking = await prisma.booking.create({
    data: {
      referenceCode: 'DEMO01',
      roomTypeId: standardRoom.id,
      checkInDate: tomorrow,
      checkOutDate: nextWeek,
      status: 'PENDING_CHECKIN',
      guestName: 'John Doe',
      guestEmail: 'john.doe@example.com',
      guestPhone: '+1234567890',
      basePrice: 80.00,
      totalPrice: 560.00, // 7 nights * 80
      locale: 'en',
    },
  });
  console.log(`✅ Demo booking created: ${demoBooking.referenceCode}`);

  console.log('\n✨ Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Admin users: 1`);
  console.log(`   - Room types: 3`);
  console.log(`   - Physical rooms: ${rooms.length}`);
  console.log(`   - Additional services: ${services.length}`);
  console.log(`   - Demo bookings: 1`);
  console.log('\n🔐 Admin credentials:');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
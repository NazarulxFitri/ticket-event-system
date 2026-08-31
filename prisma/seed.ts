import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const SECRET_KEY = process.env.QR_SECRET_KEY || 'event-wristband-secret-2026';

function generateQrHash(ticketId: string, icPassport: string): string {
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${ticketId}:${icPassport}`)
    .digest('hex');
}

function generateShortTicketNumber(): string {
  return 'TCK-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

async function main() {
  console.log('Seeding zones...');

  const vip = await prisma.zone.upsert({
    where: { name: 'VIP Category' },
    update: {},
    create: {
      name: 'VIP Category',
      description: 'Front row reserved seating + priority wristband access & exclusive merch pack',
      price: 250.0,
      capacity: 100,
      colorCode: '#8B5CF6', // Purple
    },
  });

  const standard = await prisma.zone.upsert({
    where: { name: 'Standard Seat' },
    update: {},
    create: {
      name: 'Standard Seat',
      description: 'Numbered tier 2 seating area with prime stage view',
      price: 120.0,
      capacity: 300,
      colorCode: '#3B82F6', // Blue
    },
  });

  const standing = await prisma.zone.upsert({
    where: { name: 'Standing Pit' },
    update: {},
    create: {
      name: 'Standing Pit',
      description: 'Main floor standing arena right in front of main sound stage',
      price: 80.0,
      capacity: 500,
      colorCode: '#10B981', // Emerald
    },
  });

  const vvip = await prisma.zone.upsert({
    where: { name: 'VVIP / Artiste Pass' },
    update: {},
    create: {
      name: 'VVIP / Artiste Pass',
      description: 'Complimentary backstage & media lounge access with stage side viewing',
      price: 0.0,
      capacity: 50,
      colorCode: '#F59E0B', // Amber
    },
  });

  console.log('Seeding sample tickets & redemptions...');

  // Sample Ticket 1 (Unredeemed VIP)
  const t1Id = 't1-sample-vip-uuid';
  const t1Ic = '950812-14-5521';
  await prisma.ticket.upsert({
    where: { id: t1Id },
    update: {},
    create: {
      id: t1Id,
      ticketNumber: 'TCK-VIP01',
      fullName: 'Alexander Tan',
      phone: '+60123456789',
      icPassport: t1Ic,
      tshirtSize: 'L',
      zoneId: vip.id,
      isVvip: false,
      status: 'CONFIRMED',
      qrHash: generateQrHash(t1Id, t1Ic),
    },
  });

  // Sample Ticket 2 (Redeemed Standard)
  const t2Id = 't2-sample-std-uuid';
  const t2Ic = '980325-10-6644';
  const t2 = await prisma.ticket.upsert({
    where: { id: t2Id },
    update: {},
    create: {
      id: t2Id,
      ticketNumber: 'TCK-STD02',
      fullName: 'Siti Sarah binti Ahmad',
      phone: '+60178889900',
      icPassport: t2Ic,
      tshirtSize: 'M',
      zoneId: standard.id,
      isVvip: false,
      status: 'CONFIRMED',
      qrHash: generateQrHash(t2Id, t2Ic),
    },
  });

  await prisma.redemption.upsert({
    where: { ticketId: t2.id },
    update: {},
    create: {
      ticketId: t2.id,
      redeemedAt: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
      redeemedBy: 'Staff Portal Gate 1',
      notes: 'Wristband #A-102 & Size M T-Shirt handed',
    },
  });

  // Sample Ticket 3 (VVIP Artiste)
  const t3Id = 't3-sample-vvip-uuid';
  const t3Ic = 'A98234120';
  await prisma.ticket.upsert({
    where: { id: t3Id },
    update: {},
    create: {
      id: t3Id,
      ticketNumber: 'TCK-VVIP01',
      fullName: 'Darren Vance (Artiste Guest)',
      phone: '+60193332211',
      icPassport: t3Ic,
      tshirtSize: 'XL',
      zoneId: vvip.id,
      isVvip: true,
      status: 'CONFIRMED',
      qrHash: generateQrHash(t3Id, t3Ic),
    },
  });

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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

async function main() {
  console.log('Seeding Events...');

  // Event 1
  const event1 = await prisma.event.upsert({
    where: { slug: 'neon-horizon-fest-2026' },
    update: {},
    create: {
      slug: 'neon-horizon-fest-2026',
      title: 'Neon Horizon Music Festival 2026',
      description: 'The ultimate electronic & synthwave music spectacle featuring international headliners and state-of-the-art visual lasers.',
      date: new Date('2026-10-15T18:00:00Z'),
      location: 'National Stadium Arena, Zone A',
      bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
  });

  // Event 2
  const event2 = await prisma.event.upsert({
    where: { slug: 'techx-global-summit-2026' },
    update: {},
    create: {
      slug: 'techx-global-summit-2026',
      title: 'TechX Global Innovation Summit 2026',
      description: 'Asia-Pacific premiere technology conference on AI, Web3, and future robotics with industry keynotes and hands-on workshops.',
      date: new Date('2026-11-20T09:00:00Z'),
      location: 'KL Convention Center, Grand Ballroom',
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
  });

  console.log('Seeding Zones per Event...');

  // Event 1 Zones
  const vip1 = await prisma.zone.upsert({
    where: { eventId_name: { eventId: event1.id, name: 'VIP Front Row' } },
    update: {},
    create: {
      name: 'VIP Front Row',
      description: 'Front stage pit access, dedicated express wristband collection & VIP merchandise pack',
      price: 280.0,
      capacity: 100,
      colorCode: '#8B5CF6',
      eventId: event1.id,
    },
  });

  const std1 = await prisma.zone.upsert({
    where: { eventId_name: { eventId: event1.id, name: 'Standard Seat' } },
    update: {},
    create: {
      name: 'Standard Seat',
      description: 'Numbered tier 2 seating area with direct stage view',
      price: 130.0,
      capacity: 300,
      colorCode: '#3B82F6',
      eventId: event1.id,
    },
  });

  const standing1 = await prisma.zone.upsert({
    where: { eventId_name: { eventId: event1.id, name: 'Standing Arena' } },
    update: {},
    create: {
      name: 'Standing Arena',
      description: 'Main floor standing arena',
      price: 90.0,
      capacity: 500,
      colorCode: '#10B981',
      eventId: event1.id,
    },
  });

  const vvip1 = await prisma.zone.upsert({
    where: { eventId_name: { eventId: event1.id, name: 'VVIP / Artiste Pass' } },
    update: {},
    create: {
      name: 'VVIP / Artiste Pass',
      description: 'Backstage and media lounge pass',
      price: 0.0,
      capacity: 50,
      colorCode: '#F59E0B',
      eventId: event1.id,
    },
  });

  // Event 2 Zones
  const pass2 = await prisma.zone.upsert({
    where: { eventId_name: { eventId: event2.id, name: 'All-Access Summit Pass' } },
    update: {},
    create: {
      name: 'All-Access Summit Pass',
      description: '2-Day access to keynotes, workshops, and networking dinner',
      price: 450.0,
      capacity: 200,
      colorCode: '#EC4899',
      eventId: event2.id,
    },
  });

  const std2 = await prisma.zone.upsert({
    where: { eventId_name: { eventId: event2.id, name: 'General Delegate' } },
    update: {},
    create: {
      name: 'General Delegate',
      description: 'Main stage keynotes & exhibition hall access',
      price: 190.0,
      capacity: 400,
      colorCode: '#06B6D4',
      eventId: event2.id,
    },
  });

  console.log('Seeding Sample Multi-Ticket Bookings & Redemptions...');

  // Group Booking 1 (3 Tickets for Event 1)
  const booking1 = await prisma.booking.upsert({
    where: { bookingRef: 'BK-NEON778' },
    update: {},
    create: {
      id: 'bk-sample-001',
      bookingRef: 'BK-NEON778',
      buyerName: 'Alexander Tan',
      buyerEmail: 'alex.tan@example.com',
      buyerPhone: '+60123456789',
      totalAmount: 840.0,
      eventId: event1.id,
      status: 'CONFIRMED',
    },
  });

  // Ticket 1 in Booking 1
  const t1Id = 't1-sample-vip-uuid';
  const t1Ic = '950812-14-5521';
  const t1 = await prisma.ticket.upsert({
    where: { id: t1Id },
    update: {},
    create: {
      id: t1Id,
      ticketNumber: 'TCK-NEON01',
      fullName: 'Alexander Tan',
      phone: '+60123456789',
      icPassport: t1Ic,
      tshirtSize: 'L',
      zoneId: vip1.id,
      eventId: event1.id,
      bookingId: booking1.id,
      isVvip: false,
      status: 'CONFIRMED',
      qrHash: generateQrHash(t1Id, t1Ic),
    },
  });

  // Ticket 2 in Booking 1 (Redeemed)
  const t2Id = 't2-sample-std-uuid';
  const t2Ic = '980325-10-6644';
  const t2 = await prisma.ticket.upsert({
    where: { id: t2Id },
    update: {},
    create: {
      id: t2Id,
      ticketNumber: 'TCK-NEON02',
      fullName: 'Siti Sarah binti Ahmad',
      phone: '+60178889900',
      icPassport: t2Ic,
      tshirtSize: 'M',
      zoneId: vip1.id,
      eventId: event1.id,
      bookingId: booking1.id,
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
      redeemedAt: new Date(Date.now() - 1000 * 60 * 45),
      redeemedBy: 'Staff Portal Gate 1',
      notes: 'Wristband #VIP-02 & Size M T-Shirt handed',
    },
  });

  // Ticket 3 in Booking 1
  const t3Id = 't3-sample-vip-uuid';
  const t3Ic = '010203-08-9988';
  await prisma.ticket.upsert({
    where: { id: t3Id },
    update: {},
    create: {
      id: t3Id,
      ticketNumber: 'TCK-NEON03',
      fullName: 'Jason Lee',
      phone: '+60162223344',
      icPassport: t3Ic,
      tshirtSize: 'XL',
      zoneId: vip1.id,
      eventId: event1.id,
      bookingId: booking1.id,
      isVvip: false,
      status: 'CONFIRMED',
      qrHash: generateQrHash(t3Id, t3Ic),
    },
  });

  // VVIP Ticket (Event 1)
  const vvipTicketId = 't4-sample-vvip-uuid';
  const vvipIc = 'A98234120';
  await prisma.ticket.upsert({
    where: { id: vvipTicketId },
    update: {},
    create: {
      id: vvipTicketId,
      ticketNumber: 'TCK-VVIP01',
      fullName: 'Darren Vance (Artiste Guest)',
      phone: '+60193332211',
      icPassport: vvipIc,
      tshirtSize: 'XL',
      zoneId: vvip1.id,
      eventId: event1.id,
      isVvip: true,
      status: 'CONFIRMED',
      qrHash: generateQrHash(vvipTicketId, vvipIc),
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


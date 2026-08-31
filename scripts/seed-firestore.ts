import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import crypto from 'crypto';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCpqjMNbYiK1MfrSuIHcBROLTaDxszdznk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ikedai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ikedai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ikedai.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1069259062971",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1069259062971:web:aac6ff0af978216dcab39e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SECRET_KEY = process.env.QR_SECRET_KEY || 'event-wristband-secret-2026';

function generateQrHash(ticketId: string, icPassport: string): string {
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${ticketId}:${icPassport}`)
    .digest('hex');
}

async function seed() {
  console.log('Seeding Firestore Collections...');

  const now = new Date().toISOString();

  // Event 1
  const event1Id = 'e1-neon-horizon-2026';
  await setDoc(doc(db, 'events', event1Id), {
    id: event1Id,
    slug: 'neon-horizon-fest-2026',
    title: 'Neon Horizon Music Festival 2026',
    description: 'The ultimate electronic & synthwave music spectacle featuring international headliners and state-of-the-art visual lasers.',
    date: '2026-10-15T18:00:00.000Z',
    location: 'National Stadium Arena, Zone A',
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  });

  // Event 2
  const event2Id = 'e2-techx-summit-2026';
  await setDoc(doc(db, 'events', event2Id), {
    id: event2Id,
    slug: 'techx-global-summit-2026',
    title: 'TechX Global Innovation Summit 2026',
    description: 'Asia-Pacific premiere technology conference on AI, Web3, and future robotics with industry keynotes and hands-on workshops.',
    date: '2026-11-20T09:00:00.000Z',
    location: 'KL Convention Center, Grand Ballroom',
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  });

  // Zones Event 1
  const zVip1 = 'z1-vip-front-row';
  await setDoc(doc(db, 'zones', zVip1), {
    id: zVip1,
    name: 'VIP Front Row',
    description: 'Front stage pit access, dedicated express wristband collection & VIP merchandise pack',
    price: 280.0,
    capacity: 100,
    colorCode: '#8B5CF6',
    eventId: event1Id,
    createdAt: now,
    updatedAt: now,
  });

  const zStd1 = 'z2-standard-seat';
  await setDoc(doc(db, 'zones', zStd1), {
    id: zStd1,
    name: 'Standard Seat',
    description: 'Numbered tier 2 seating area with direct stage view',
    price: 130.0,
    capacity: 300,
    colorCode: '#3B82F6',
    eventId: event1Id,
    createdAt: now,
    updatedAt: now,
  });

  const zStanding1 = 'z3-standing-arena';
  await setDoc(doc(db, 'zones', zStanding1), {
    id: zStanding1,
    name: 'Standing Arena',
    description: 'Main floor standing arena',
    price: 90.0,
    capacity: 500,
    colorCode: '#10B981',
    eventId: event1Id,
    createdAt: now,
    updatedAt: now,
  });

  const zVvip1 = 'z4-vvip-artiste-pass';
  await setDoc(doc(db, 'zones', zVvip1), {
    id: zVvip1,
    name: 'VVIP / Artiste Pass',
    description: 'Backstage and media lounge pass',
    price: 0.0,
    capacity: 50,
    colorCode: '#F59E0B',
    eventId: event1Id,
    createdAt: now,
    updatedAt: now,
  });

  // Zones Event 2
  const zPass2 = 'z5-all-access-pass';
  await setDoc(doc(db, 'zones', zPass2), {
    id: zPass2,
    name: 'All-Access Summit Pass',
    description: '2-Day access to keynotes, workshops, and networking dinner',
    price: 450.0,
    capacity: 200,
    colorCode: '#EC4899',
    eventId: event2Id,
    createdAt: now,
    updatedAt: now,
  });

  const zStd2 = 'z6-general-delegate';
  await setDoc(doc(db, 'zones', zStd2), {
    id: zStd2,
    name: 'General Delegate',
    description: 'Main stage keynotes & exhibition hall access',
    price: 190.0,
    capacity: 400,
    colorCode: '#06B6D4',
    eventId: event2Id,
    createdAt: now,
    updatedAt: now,
  });

  // Sample Booking
  const booking1Id = 'bk-sample-001';
  await setDoc(doc(db, 'bookings', booking1Id), {
    id: booking1Id,
    bookingRef: 'BK-NEON778',
    buyerName: 'Alexander Tan',
    buyerEmail: 'alex.tan@example.com',
    buyerPhone: '+60123456789',
    totalAmount: 840.0,
    eventId: event1Id,
    status: 'CONFIRMED',
    createdAt: now,
    updatedAt: now,
  });

  // Tickets
  const t1Id = 't1-sample-vip-uuid';
  const t1Ic = '950812-14-5521';
  await setDoc(doc(db, 'tickets', t1Id), {
    id: t1Id,
    ticketNumber: 'TCK-NEON01',
    fullName: 'Alexander Tan',
    phone: '+60123456789',
    icPassport: t1Ic,
    tshirtSize: 'L',
    zoneId: zVip1,
    eventId: event1Id,
    bookingId: booking1Id,
    isVvip: false,
    status: 'CONFIRMED',
    qrHash: generateQrHash(t1Id, t1Ic),
    createdAt: now,
    updatedAt: now,
  });

  const t2Id = 't2-sample-std-uuid';
  const t2Ic = '980325-10-6644';
  await setDoc(doc(db, 'tickets', t2Id), {
    id: t2Id,
    ticketNumber: 'TCK-NEON02',
    fullName: 'Siti Sarah binti Ahmad',
    phone: '+60178889900',
    icPassport: t2Ic,
    tshirtSize: 'M',
    zoneId: zVip1,
    eventId: event1Id,
    bookingId: booking1Id,
    isVvip: false,
    status: 'CONFIRMED',
    qrHash: generateQrHash(t2Id, t2Ic),
    createdAt: now,
    updatedAt: now,
  });

  // Redemption for t2
  const r2Id = 'r2-sample-redemption-uuid';
  await setDoc(doc(db, 'redemptions', r2Id), {
    id: r2Id,
    ticketId: t2Id,
    redeemedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    redeemedBy: 'Staff Portal Gate 1',
    notes: 'Wristband #VIP-02 & Size M T-Shirt handed',
  });

  console.log('Firestore Seeding Complete!');
}

seed().catch(console.error);

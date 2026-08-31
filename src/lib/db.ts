import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import crypto from 'crypto';
import { generateQrHash, generateShortTicketNumber } from './crypto';

// Collection references
export const eventsCol = collection(db, 'events');
export const zonesCol = collection(db, 'zones');
export const bookingsCol = collection(db, 'bookings');
export const ticketsCol = collection(db, 'tickets');
export const redemptionsCol = collection(db, 'redemptions');

export interface EventData {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  location: string;
  bannerUrl: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ZoneData {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  colorCode: string;
  eventId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingData {
  id: string;
  bookingRef: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  totalAmount: number;
  status: string;
  eventId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketData {
  id: string;
  ticketNumber: string;
  fullName: string;
  phone: string;
  icPassport: string;
  tshirtSize: string;
  zoneId: string;
  eventId: string;
  bookingId: string | null;
  isVvip: boolean;
  status: string;
  qrHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface RedemptionData {
  id: string;
  ticketId: string;
  redeemedAt: string;
  redeemedBy: string;
  notes: string | null;
}

// ----------------------------------------------------
// Events
// ----------------------------------------------------
export async function getEvents() {
  const eventSnap = await getDocs(eventsCol);
  const events = eventSnap.docs.map((d) => ({ id: d.id, ...d.data() } as EventData));

  // Sort by date ascending
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const zoneSnap = await getDocs(zonesCol);
  const allZones = zoneSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ZoneData));

  const ticketSnap = await getDocs(query(ticketsCol, where('status', '==', 'CONFIRMED')));
  const allTickets = ticketSnap.docs.map((d) => d.data() as TicketData);

  return events.map((event) => {
    const eventZones = allZones.filter((z) => z.eventId === event.id);
    const minPrice = eventZones.length > 0 ? Math.min(...eventZones.map((z) => z.price)) : 0;
    const totalCapacity = eventZones.reduce((sum, z) => sum + z.capacity, 0);
    const bookedTickets = allTickets.filter((t) => t.eventId === event.id).length;

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      bannerUrl: event.bannerUrl,
      status: event.status,
      minPrice,
      totalCapacity,
      bookedTickets,
      zonesCount: eventZones.length,
      zones: eventZones,
    };
  });
}

export async function getEventByIdOrSlug(idOrSlug: string) {
  // First search by ID
  const docRef = doc(db, 'events', idOrSlug);
  const docSnap = await getDoc(docRef);

  let event: EventData | null = null;

  if (docSnap.exists()) {
    event = { id: docSnap.id, ...docSnap.data() } as EventData;
  } else {
    // Search by slug
    const q = query(eventsCol, where('slug', '==', idOrSlug));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      const d = querySnap.docs[0];
      event = { id: d.id, ...d.data() } as EventData;
    }
  }

  if (!event) return null;

  // Get zones for this event
  const zQuery = query(zonesCol, where('eventId', '==', event.id));
  const zSnap = await getDocs(zQuery);
  const eventZones = zSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ZoneData));

  // Get tickets for this event
  const tQuery = query(ticketsCol, where('eventId', '==', event.id), where('status', '==', 'CONFIRMED'));
  const tSnap = await getDocs(tQuery);
  const confirmedTickets = tSnap.docs.map((d) => d.data() as TicketData);

  const zonesWithAvailability = eventZones.map((z) => {
    const booked = confirmedTickets.filter((t) => t.zoneId === z.id).length;
    const remaining = Math.max(0, z.capacity - booked);
    return {
      id: z.id,
      name: z.name,
      description: z.description,
      price: z.price,
      capacity: z.capacity,
      bookedCount: booked,
      remainingCapacity: remaining,
      colorCode: z.colorCode,
      isSoldOut: remaining === 0,
    };
  });

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    bannerUrl: event.bannerUrl,
    status: event.status,
    zones: zonesWithAvailability,
  };
}

export async function createEvent(data: {
  title: string;
  slug?: string;
  description: string;
  date: string | Date;
  location: string;
  bannerUrl?: string;
  zones?: any[];
}) {
  const eventId = crypto.randomUUID();
  const generatedSlug =
    data.slug ||
    data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const now = new Date().toISOString();
  const dateIso = new Date(data.date).toISOString();

  const eventPayload: EventData = {
    id: eventId,
    title: data.title,
    slug: generatedSlug,
    description: data.description,
    date: dateIso,
    location: data.location,
    bannerUrl:
      data.bannerUrl ||
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'events', eventId), eventPayload);

  const zonesToCreate =
    data.zones && Array.isArray(data.zones) && data.zones.length > 0
      ? data.zones.map((z: any) => ({
          name: z.name,
          description: z.description || '',
          price: parseFloat(z.price) || 0,
          capacity: parseInt(z.capacity) || 100,
          colorCode: z.colorCode || '#3B82F6',
        }))
      : [
          {
            name: 'VIP Category',
            description: 'Front stage VIP access & merch pack',
            price: 250,
            capacity: 100,
            colorCode: '#8B5CF6',
          },
          {
            name: 'Standard Seat',
            description: 'Numbered tier 2 seating area',
            price: 120,
            capacity: 300,
            colorCode: '#3B82F6',
          },
          {
            name: 'Standing Arena',
            description: 'Main floor standing arena',
            price: 80,
            capacity: 500,
            colorCode: '#10B981',
          },
        ];

  const createdZones: ZoneData[] = [];
  for (const z of zonesToCreate) {
    const zoneId = crypto.randomUUID();
    const zonePayload: ZoneData = {
      id: zoneId,
      name: z.name,
      description: z.description,
      price: z.price,
      capacity: z.capacity,
      colorCode: z.colorCode,
      eventId: eventId,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'zones', zoneId), zonePayload);
    createdZones.push(zonePayload);
  }

  return { ...eventPayload, zones: createdZones };
}

export async function updateEvent(
  id: string,
  data: {
    title?: string;
    description?: string;
    date?: string | Date;
    location?: string;
    bannerUrl?: string;
    status?: string;
    newZone?: any;
  }
) {
  const docRef = doc(db, 'events', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const now = new Date().toISOString();
  const updatePayload: any = { updatedAt: now };

  if (data.title) updatePayload.title = data.title;
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.date) updatePayload.date = new Date(data.date).toISOString();
  if (data.location) updatePayload.location = data.location;
  if (data.bannerUrl) updatePayload.bannerUrl = data.bannerUrl;
  if (data.status) updatePayload.status = data.status;

  await updateDoc(docRef, updatePayload);

  if (data.newZone && data.newZone.name) {
    const zoneId = crypto.randomUUID();
    const zonePayload: ZoneData = {
      id: zoneId,
      name: data.newZone.name,
      description: data.newZone.description || '',
      price: parseFloat(data.newZone.price) || 0,
      capacity: parseInt(data.newZone.capacity) || 100,
      colorCode: data.newZone.colorCode || '#3B82F6',
      eventId: id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'zones', zoneId), zonePayload);
  }

  const updatedSnap = await getDoc(docRef);
  const zQuery = query(zonesCol, where('eventId', '==', id));
  const zSnap = await getDocs(zQuery);
  const zones = zSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return { id: updatedSnap.id, ...updatedSnap.data(), zones };
}

// ----------------------------------------------------
// Zones
// ----------------------------------------------------
export async function getZones(eventId?: string | null) {
  let q = query(zonesCol);
  if (eventId) {
    q = query(zonesCol, where('eventId', '==', eventId));
  }
  const zSnap = await getDocs(q);
  const zones = zSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ZoneData));

  // Fetch events for title matching
  const eSnap = await getDocs(eventsCol);
  const eventsMap = new Map(eSnap.docs.map((d) => [d.id, d.data().title]));

  // Fetch confirmed tickets
  const tSnap = await getDocs(query(ticketsCol, where('status', '==', 'CONFIRMED')));
  const tickets = tSnap.docs.map((d) => d.data() as TicketData);

  return zones.map((z) => {
    const booked = tickets.filter((t) => t.zoneId === z.id).length;
    const remaining = Math.max(0, z.capacity - booked);
    return {
      id: z.id,
      name: z.name,
      description: z.description,
      price: z.price,
      capacity: z.capacity,
      bookedCount: booked,
      remainingCapacity: remaining,
      colorCode: z.colorCode,
      eventId: z.eventId,
      eventTitle: eventsMap.get(z.eventId) || 'Event',
      isSoldOut: remaining === 0,
    };
  });
}

export async function updateZone(
  id: string,
  data: {
    name?: string;
    price?: number;
    capacity?: number;
    colorCode?: string;
    description?: string;
  }
) {
  const docRef = doc(db, 'zones', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const updatePayload: any = { updatedAt: new Date().toISOString() };
  if (data.name) updatePayload.name = data.name;
  if (data.price !== undefined) updatePayload.price = data.price;
  if (data.capacity !== undefined) updatePayload.capacity = data.capacity;
  if (data.colorCode) updatePayload.colorCode = data.colorCode;
  if (data.description !== undefined) updatePayload.description = data.description;

  await updateDoc(docRef, updatePayload);
  const updatedSnap = await getDoc(docRef);
  return { id: updatedSnap.id, ...updatedSnap.data() };
}

// ----------------------------------------------------
// Bookings & Tickets
// ----------------------------------------------------
export async function bookTickets(params: {
  targetZoneId: string;
  targetEventId?: string;
  buyerInfo: { name: string; email?: string; phone: string };
  attendeeList: Array<{ fullName: string; phone: string; icPassport: string; tshirtSize: string }>;
}) {
  const { targetZoneId, targetEventId, buyerInfo, attendeeList } = params;

  // Use Firestore transaction for capacity verification & atomic creation
  return await runTransaction(db, async (transaction) => {
    const zoneRef = doc(db, 'zones', targetZoneId);
    const zoneSnap = await transaction.get(zoneRef);

    if (!zoneSnap.exists()) {
      throw new Error('Selected ticket zone does not exist.');
    }

    const zone = { id: zoneSnap.id, ...zoneSnap.data() } as ZoneData;
    const resolvedEventId = targetEventId || zone.eventId;

    // Fetch existing tickets for capacity check
    const tQuery = query(
      ticketsCol,
      where('zoneId', '==', zone.id),
      where('status', '==', 'CONFIRMED')
    );
    const tSnap = await getDocs(tQuery);
    const bookedCount = tSnap.size;
    const remainingCapacity = zone.capacity - bookedCount;

    if (remainingCapacity < attendeeList.length) {
      throw new Error(
        `Only ${remainingCapacity} ticket(s) remaining in ${zone.name}. You requested ${attendeeList.length}.`
      );
    }

    // Fetch event
    const eventRef = doc(db, 'events', resolvedEventId);
    const eventSnap = await transaction.get(eventRef);
    const eventData = eventSnap.exists() ? eventSnap.data() : { title: 'Main Event' };

    const bookingId = crypto.randomUUID();
    const bookingRef = 'BK-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const totalAmount = zone.price * attendeeList.length;
    const now = new Date().toISOString();

    const bookingPayload: BookingData = {
      id: bookingId,
      bookingRef,
      buyerName: buyerInfo.name.trim(),
      buyerEmail: buyerInfo.email ? buyerInfo.email.trim() : 'buyer@example.com',
      buyerPhone: buyerInfo.phone.trim(),
      totalAmount,
      eventId: resolvedEventId,
      status: 'CONFIRMED',
      createdAt: now,
      updatedAt: now,
    };

    transaction.set(doc(db, 'bookings', bookingId), bookingPayload);

    const createdTickets = [];
    for (const att of attendeeList) {
      const newId = crypto.randomUUID();
      const formattedIc = att.icPassport.trim().toUpperCase();
      const qrHash = generateQrHash(newId, formattedIc);
      const ticketNumber = generateShortTicketNumber();

      const ticketPayload: TicketData = {
        id: newId,
        ticketNumber,
        fullName: att.fullName.trim(),
        phone: att.phone.trim(),
        icPassport: formattedIc,
        tshirtSize: att.tshirtSize,
        zoneId: zone.id,
        eventId: resolvedEventId,
        bookingId,
        isVvip: false,
        status: 'CONFIRMED',
        qrHash,
        createdAt: now,
        updatedAt: now,
      };

      transaction.set(doc(db, 'tickets', newId), ticketPayload);

      createdTickets.push({
        ...ticketPayload,
        zone,
        event: { title: eventData.title },
        qrPayload: JSON.stringify({
          ticketId: newId,
          ticketNumber,
          icPassport: formattedIc,
          hash: qrHash,
        }),
      });
    }

    return { booking: bookingPayload, createdTickets };
  });
}

export async function getBookingByIdOrRef(idOrRef: string) {
  let bookingSnap = await getDoc(doc(db, 'bookings', idOrRef));
  let booking: BookingData | null = null;

  if (bookingSnap.exists()) {
    booking = { id: bookingSnap.id, ...bookingSnap.data() } as BookingData;
  } else {
    const q = query(bookingsCol, where('bookingRef', '==', idOrRef));
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      booking = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as BookingData;
    }
  }

  if (!booking) return null;

  // Fetch Event
  const eSnap = await getDoc(doc(db, 'events', booking.eventId));
  const event = eSnap.exists() ? { id: eSnap.id, ...eSnap.data() } : null;

  // Fetch Tickets
  const tQuery = query(ticketsCol, where('bookingId', '==', booking.id));
  const tSnap = await getDocs(tQuery);
  const tickets = tSnap.docs.map((d) => ({ id: d.id, ...d.data() } as TicketData));

  // Fetch Zones & Redemptions
  const zSnap = await getDocs(zonesCol);
  const zonesMap = new Map(zSnap.docs.map((d) => [d.id, d.data()]));

  const rSnap = await getDocs(redemptionsCol);
  const redemptionsMap = new Map(rSnap.docs.map((d) => [d.data().ticketId, d.data() as RedemptionData]));

  const formattedTickets = tickets.map((t) => {
    const zone = zonesMap.get(t.zoneId) || { name: 'Standard', colorCode: '#3B82F6' };
    const redemption = redemptionsMap.get(t.id) || null;
    const qrPayload = JSON.stringify({
      ticketId: t.id,
      ticketNumber: t.ticketNumber,
      icPassport: t.icPassport,
      hash: t.qrHash,
    });

    return {
      id: t.id,
      ticketNumber: t.ticketNumber,
      fullName: t.fullName,
      phone: t.phone,
      icPassport: t.icPassport,
      tshirtSize: t.tshirtSize,
      zoneName: zone.name,
      zoneColor: zone.colorCode,
      isVvip: t.isVvip,
      qrHash: t.qrHash,
      qrPayload,
      isRedeemed: !!redemption,
      redeemedAt: redemption?.redeemedAt || null,
    };
  });

  return {
    id: booking.id,
    bookingRef: booking.bookingRef,
    buyerName: booking.buyerName,
    buyerEmail: booking.buyerEmail,
    buyerPhone: booking.buyerPhone,
    totalAmount: booking.totalAmount,
    status: booking.status,
    createdAt: booking.createdAt,
    event,
    tickets: formattedTickets,
  };
}

export async function getTicketByCodeOrId(code: string) {
  const searchId = code.trim();
  const searchUpper = searchId.toUpperCase();

  // Try ID lookup
  let ticketSnap = await getDoc(doc(db, 'tickets', searchId));
  let ticket: TicketData | null = null;

  if (ticketSnap.exists()) {
    ticket = { id: ticketSnap.id, ...ticketSnap.data() } as TicketData;
  } else {
    // Try Ticket Number lookup
    let q = query(ticketsCol, where('ticketNumber', '==', searchUpper));
    let qSnap = await getDocs(q);
    if (!qSnap.empty) {
      ticket = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as TicketData;
    } else {
      // Try IC / Passport lookup
      q = query(ticketsCol, where('icPassport', '==', searchUpper));
      qSnap = await getDocs(q);
      if (!qSnap.empty) {
        ticket = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as TicketData;
      }
    }
  }

  if (!ticket) return null;

  // Get zone
  const zSnap = await getDoc(doc(db, 'zones', ticket.zoneId));
  const zone = zSnap.exists() ? zSnap.data() : { name: 'Standard', colorCode: '#3B82F6' };

  // Get event
  const eSnap = await getDoc(doc(db, 'events', ticket.eventId));
  const event = eSnap.exists() ? eSnap.data() : null;

  // Get redemption
  const rQuery = query(redemptionsCol, where('ticketId', '==', ticket.id));
  const rSnap = await getDocs(rQuery);
  const redemption = !rSnap.empty ? (rSnap.docs[0].data() as RedemptionData) : null;

  // Group info from booking
  let groupTicketsCount = 1;
  let groupRedeemedCount = redemption ? 1 : 0;
  let bookingRef = null;

  if (ticket.bookingId) {
    const bSnap = await getDoc(doc(db, 'bookings', ticket.bookingId));
    if (bSnap.exists()) {
      bookingRef = bSnap.data().bookingRef;
      const groupTicketsSnap = await getDocs(query(ticketsCol, where('bookingId', '==', ticket.bookingId)));
      const groupTicketIds = groupTicketsSnap.docs.map((d) => d.id);
      groupTicketsCount = groupTicketIds.length;

      const groupRedemptionsSnap = await getDocs(redemptionsCol);
      groupRedeemedCount = groupRedemptionsSnap.docs.filter((d) =>
        groupTicketIds.includes(d.data().ticketId)
      ).length;
    }
  }

  return {
    ticket,
    zone,
    event,
    redemption,
    bookingRef,
    groupTicketsCount,
    groupRedeemedCount,
  };
}

export async function redeemTicket(ticketId: string, staffName?: string, notes?: string) {
  const tSnap = await getDoc(doc(db, 'tickets', ticketId));
  if (!tSnap.exists()) {
    return { error: 'Ticket not found.', status: 404 };
  }
  const ticket = { id: tSnap.id, ...tSnap.data() } as TicketData;

  // Check if already redeemed
  const rQuery = query(redemptionsCol, where('ticketId', '==', ticketId));
  const rSnap = await getDocs(rQuery);
  if (!rSnap.empty) {
    const existing = rSnap.docs[0].data() as RedemptionData;
    return {
      error: `Wristband ALREADY REDEEMED on ${new Date(existing.redeemedAt).toLocaleString()} by ${existing.redeemedBy}. Double redemption blocked!`,
      redemption: existing,
      status: 409,
    };
  }

  // Fetch Zone name
  const zSnap = await getDoc(doc(db, 'zones', ticket.zoneId));
  const zoneName = zSnap.exists() ? zSnap.data().name : 'Standard';

  const redemptionId = crypto.randomUUID();
  const redemptionPayload: RedemptionData = {
    id: redemptionId,
    ticketId: ticket.id,
    redeemedAt: new Date().toISOString(),
    redeemedBy: (staffName || 'Staff Gate 1').trim(),
    notes: (notes || `Wristband & Size ${ticket.tshirtSize} T-Shirt distributed`).trim(),
  };

  await setDoc(doc(db, 'redemptions', redemptionId), redemptionPayload);

  return {
    success: true,
    message: `Wristband and Size ${ticket.tshirtSize} T-Shirt successfully marked as REDEEMED for ${ticket.fullName}!`,
    redemption: redemptionPayload,
    guest: {
      fullName: ticket.fullName,
      tshirtSize: ticket.tshirtSize,
      zoneName,
    },
  };
}

export async function createVvipTicket(params: {
  fullName: string;
  phone?: string;
  icPassport: string;
  tshirtSize: string;
  eventId?: string;
  notes?: string;
}) {
  const { fullName, phone, icPassport, tshirtSize, eventId } = params;
  const formattedIc = icPassport.trim().toUpperCase();

  let targetEventId = eventId;
  if (!targetEventId) {
    const eQuery = query(eventsCol, where('status', '==', 'ACTIVE'), limit(1));
    const eSnap = await getDocs(eQuery);
    if (!eSnap.empty) {
      targetEventId = eSnap.docs[0].id;
    } else {
      const allEventsSnap = await getDocs(query(eventsCol, limit(1)));
      if (!allEventsSnap.empty) {
        targetEventId = allEventsSnap.docs[0].id;
      }
    }
  }

  if (!targetEventId) {
    throw new Error('No event found. Please create an event first.');
  }

  // Fetch Event
  const eSnap = await getDoc(doc(db, 'events', targetEventId));
  const eventTitle = eSnap.exists() ? eSnap.data().title : 'Main Event';

  // Find or create VVIP zone for this event
  const zQuery = query(zonesCol, where('eventId', '==', targetEventId));
  const zSnap = await getDocs(zQuery);
  let vvipZone = zSnap.docs.find((d) => d.data().name.includes('VVIP'));

  let vvipZoneId = '';
  let vvipZoneData: any = null;

  if (vvipZone) {
    vvipZoneId = vvipZone.id;
    vvipZoneData = vvipZone.data();
  } else {
    vvipZoneId = crypto.randomUUID();
    vvipZoneData = {
      id: vvipZoneId,
      name: 'VVIP / Artiste Pass',
      description: 'Complimentary guest & artiste pass',
      price: 0,
      capacity: 100,
      colorCode: '#F59E0B',
      eventId: targetEventId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'zones', vvipZoneId), vvipZoneData);
  }

  const newId = crypto.randomUUID();
  const qrHash = generateQrHash(newId, formattedIc);
  const ticketNumber = generateShortTicketNumber();
  const now = new Date().toISOString();

  const ticketPayload: TicketData = {
    id: newId,
    ticketNumber,
    fullName: fullName.trim(),
    phone: (phone || 'N/A').trim(),
    icPassport: formattedIc,
    tshirtSize,
    zoneId: vvipZoneId,
    eventId: targetEventId,
    bookingId: null,
    isVvip: true,
    status: 'CONFIRMED',
    qrHash,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'tickets', newId), ticketPayload);

  const qrPayload = JSON.stringify({
    ticketId: newId,
    ticketNumber,
    icPassport: formattedIc,
    hash: qrHash,
  });

  return {
    id: newId,
    ticketNumber,
    fullName: ticketPayload.fullName,
    phone: ticketPayload.phone,
    icPassport: formattedIc,
    tshirtSize,
    zoneName: vvipZoneData.name,
    zoneColor: vvipZoneData.colorCode,
    eventTitle,
    isVvip: true,
    qrHash,
    qrPayload,
  };
}

export async function getAnalytics(eventId?: string | null) {
  // 1. Events list
  const eSnap = await getDocs(query(eventsCol));
  const events = eSnap.docs
    .map((d) => ({ id: d.id, title: d.data().title, slug: d.data().slug, date: d.data().date }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Filter tickets
  let tQuery = query(ticketsCol, where('status', '==', 'CONFIRMED'));
  if (eventId) {
    tQuery = query(ticketsCol, where('eventId', '==', eventId), where('status', '==', 'CONFIRMED'));
  }
  const tSnap = await getDocs(tQuery);
  const tickets = tSnap.docs.map((d) => ({ id: d.id, ...d.data() } as TicketData));

  // 3. Redemptions
  const rSnap = await getDocs(redemptionsCol);
  const redemptions = rSnap.docs.map((d) => d.data() as RedemptionData);
  const redemptionsMap = new Map(redemptions.map((r) => [r.ticketId, r]));

  const ticketIds = new Set(tickets.map((t) => t.id));
  const totalTickets = tickets.length;
  const totalRedeemed = redemptions.filter((r) => ticketIds.has(r.ticketId)).length;

  // 4. Zones
  let zQuery = query(zonesCol);
  if (eventId) {
    zQuery = query(zonesCol, where('eventId', '==', eventId));
  }
  const zSnap = await getDocs(zQuery);
  const zones = zSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ZoneData));

  // 5. T-Shirt Breakdown
  const tshirtBreakdown: Record<string, number> = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
  tickets.forEach((t) => {
    if (tshirtBreakdown.hasOwnProperty(t.tshirtSize)) {
      tshirtBreakdown[t.tshirtSize] += 1;
    }
  });

  // 6. Bookings for Ref lookup
  const bSnap = await getDocs(bookingsCol);
  const bookingsMap = new Map(bSnap.docs.map((d) => [d.id, d.data().bookingRef]));

  // 7. Zone breakdown & total revenue
  let totalRevenue = 0;
  const eventsMap = new Map(events.map((e) => [e.id, e.title]));

  const zoneBreakdown = zones.map((z) => {
    const sold = tickets.filter((t) => t.zoneId === z.id).length;
    const revenue = sold * z.price;
    totalRevenue += revenue;
    return {
      id: z.id,
      name: z.name,
      eventTitle: eventsMap.get(z.eventId) || 'Event',
      capacity: z.capacity,
      sold,
      remaining: Math.max(0, z.capacity - sold),
      price: z.price,
      revenue,
      colorCode: z.colorCode,
    };
  });

  // Recent 100 tickets sorted by createdAt desc
  const sortedTickets = [...tickets].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 100);

  const zonesMap = new Map(zones.map((z) => [z.id, z]));

  const recentTickets = sortedTickets.map((t) => {
    const z = zonesMap.get(t.zoneId) || { name: 'Standard', colorCode: '#3B82F6' };
    const redemption = redemptionsMap.get(t.id) || null;
    return {
      id: t.id,
      ticketNumber: t.ticketNumber,
      fullName: t.fullName,
      phone: t.phone,
      icPassport: t.icPassport,
      tshirtSize: t.tshirtSize,
      zoneName: z.name,
      eventTitle: eventsMap.get(t.eventId) || 'Event',
      bookingRef: t.bookingId ? bookingsMap.get(t.bookingId) || null : null,
      zoneColor: z.colorCode,
      isVvip: t.isVvip,
      isRedeemed: !!redemption,
      redeemedAt: redemption?.redeemedAt || null,
      createdAt: t.createdAt,
    };
  });

  const unredeemedCount = Math.max(0, totalTickets - totalRedeemed);
  const redemptionRate = totalTickets > 0 ? Math.round((totalRedeemed / totalTickets) * 100) : 0;

  return {
    events: events.map((e) => ({ id: e.id, title: e.title, slug: e.slug })),
    selectedEventId: eventId || null,
    analytics: {
      totalTickets,
      totalRedeemed,
      unredeemedCount,
      redemptionRate,
      totalRevenue,
      tshirtBreakdown,
      zoneBreakdown,
      recentTickets,
    },
  };
}

export async function getExportData() {
  const tSnap = await getDocs(ticketsCol);
  const tickets = tSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as TicketData))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const zSnap = await getDocs(zonesCol);
  const zonesMap = new Map(zSnap.docs.map((d) => [d.id, d.data().name]));

  const rSnap = await getDocs(redemptionsCol);
  const redemptionsMap = new Map(rSnap.docs.map((d) => [d.data().ticketId, d.data() as RedemptionData]));

  return tickets.map((t) => {
    const zoneName = zonesMap.get(t.zoneId) || 'Standard';
    const redemption = redemptionsMap.get(t.id) || null;
    return {
      ticketNumber: t.ticketNumber,
      id: t.id,
      fullName: t.fullName,
      phone: t.phone,
      icPassport: t.icPassport,
      tshirtSize: t.tshirtSize,
      zoneName,
      isVvip: t.isVvip,
      redemption,
      createdAt: t.createdAt,
    };
  });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQrHash, generateShortTicketNumber } from '@/lib/crypto';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, zoneId, buyer, attendees, fullName, phone, icPassport, tshirtSize } = body;

    // Handle legacy single-ticket payload OR multi-ticket payload
    let targetZoneId = zoneId;
    let targetEventId = eventId;
    let buyerInfo = buyer;
    let attendeeList: Array<{ fullName: string; phone: string; icPassport: string; tshirtSize: string }> = [];

    if (attendees && Array.isArray(attendees) && attendees.length > 0) {
      attendeeList = attendees;
    } else if (fullName && phone && icPassport && tshirtSize) {
      attendeeList = [{ fullName, phone, icPassport, tshirtSize }];
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid booking data. Please provide zone and attendee details.' },
        { status: 400 }
      );
    }

    if (!targetZoneId) {
      return NextResponse.json(
        { success: false, error: 'zoneId is required.' },
        { status: 400 }
      );
    }

    // Set default buyer info if not explicitly provided
    if (!buyerInfo || !buyerInfo.name) {
      buyerInfo = {
        name: attendeeList[0].fullName,
        email: `${attendeeList[0].fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: attendeeList[0].phone,
      };
    }

    const ticketQuantity = attendeeList.length;

    // Atomic transaction for capacity check & batch booking creation
    const result = await prisma.$transaction(async (tx) => {
      const zone = await tx.zone.findUnique({
        where: { id: targetZoneId },
        include: {
          event: true,
          _count: {
            select: {
              tickets: { where: { status: 'CONFIRMED' } },
            },
          },
        },
      });

      if (!zone) {
        throw new Error('Selected ticket zone does not exist.');
      }

      const resolvedEventId = targetEventId || zone.eventId;

      const bookedCount = zone._count.tickets;
      const remainingCapacity = zone.capacity - bookedCount;

      if (remainingCapacity < ticketQuantity) {
        throw new Error(
          `Only ${remainingCapacity} ticket(s) remaining in ${zone.name}. You requested ${ticketQuantity}.`
        );
      }

      const bookingRef = 'BK-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      const totalAmount = zone.price * ticketQuantity;

      // Create Booking record
      const booking = await tx.booking.create({
        data: {
          bookingRef,
          buyerName: buyerInfo.name.trim(),
          buyerEmail: buyerInfo.email ? buyerInfo.email.trim() : 'buyer@example.com',
          buyerPhone: buyerInfo.phone.trim(),
          totalAmount,
          eventId: resolvedEventId,
          status: 'CONFIRMED',
        },
      });

      // Create $N$ individual Tickets
      const createdTickets = [];
      for (let i = 0; i < attendeeList.length; i++) {
        const att = attendeeList[i];
        const newId = crypto.randomUUID();
        const formattedIc = att.icPassport.trim().toUpperCase();
        const qrHash = generateQrHash(newId, formattedIc);
        const ticketNumber = generateShortTicketNumber();

        const ticket = await tx.ticket.create({
          data: {
            id: newId,
            ticketNumber,
            fullName: att.fullName.trim(),
            phone: att.phone.trim(),
            icPassport: formattedIc,
            tshirtSize: att.tshirtSize,
            zoneId: zone.id,
            eventId: resolvedEventId,
            bookingId: booking.id,
            isVvip: false,
            status: 'CONFIRMED',
            qrHash,
          },
          include: {
            zone: true,
            event: true,
          },
        });

        createdTickets.push({
          ...ticket,
          qrPayload: JSON.stringify({
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            icPassport: ticket.icPassport,
            hash: ticket.qrHash,
          }),
        });
      }

      return { booking, createdTickets };
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: result.booking.id,
        bookingRef: result.booking.bookingRef,
        buyerName: result.booking.buyerName,
        buyerEmail: result.booking.buyerEmail,
        buyerPhone: result.booking.buyerPhone,
        totalAmount: result.booking.totalAmount,
        ticketsCount: result.createdTickets.length,
      },
      tickets: result.createdTickets,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete booking' },
      { status: 400 }
    );
  }
}

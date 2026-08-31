import { NextResponse } from 'next/server';
import { getTicketByCodeOrId } from '@/lib/db';
import { verifyQrHash } from '@/lib/crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Query parameter "code" is required.' },
        { status: 400 }
      );
    }

    let searchId = code.trim();
    let parsedPayload: any = null;

    if (code.startsWith('{') && code.endsWith('}')) {
      try {
        parsedPayload = JSON.parse(code);
        if (parsedPayload.ticketId) {
          searchId = parsedPayload.ticketId;
        }
      } catch (e) {
        // Ignore JSON parse error
      }
    }

    const ticketData = await getTicketByCodeOrId(searchId);

    if (!ticketData) {
      return NextResponse.json(
        { success: false, error: 'No ticket found matching the provided QR or search code.' },
        { status: 404 }
      );
    }

    const { ticket, zone, event, redemption, bookingRef, groupTicketsCount, groupRedeemedCount } = ticketData;

    let isAuthentic = true;
    if (parsedPayload && parsedPayload.hash) {
      try {
        isAuthentic = verifyQrHash(ticket.id, ticket.icPassport, parsedPayload.hash);
      } catch (err) {
        isAuthentic = false;
      }
    }

    const isRedeemed = !!redemption;

    return NextResponse.json({
      success: true,
      isAuthentic,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        fullName: ticket.fullName,
        phone: ticket.phone,
        icPassport: ticket.icPassport,
        tshirtSize: ticket.tshirtSize,
        zoneName: zone.name,
        zoneColor: zone.colorCode,
        eventName: event?.title || 'Main Event',
        eventDate: event?.date,
        eventLocation: event?.location,
        isVvip: ticket.isVvip,
        status: ticket.status,
        createdAt: ticket.createdAt,
        bookingRef,
        groupTicketsCount,
        groupRedeemedCount,
        redemption: redemption
          ? {
              id: redemption.id,
              redeemedAt: redemption.redeemedAt,
              redeemedBy: redemption.redeemedBy,
              notes: redemption.notes,
            }
          : null,
        isRedeemed,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { bookTickets } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, zoneId, buyer, attendees, fullName, phone, icPassport, tshirtSize } = body;

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

    if (!buyerInfo || !buyerInfo.name) {
      buyerInfo = {
        name: attendeeList[0].fullName,
        email: `${attendeeList[0].fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: attendeeList[0].phone,
      };
    }

    const result = await bookTickets({
      targetZoneId,
      targetEventId,
      buyerInfo,
      attendeeList,
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

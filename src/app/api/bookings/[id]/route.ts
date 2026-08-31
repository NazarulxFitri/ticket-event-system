import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: id }, { bookingRef: id }],
      },
      include: {
        event: true,
        tickets: {
          include: {
            zone: true,
            redemption: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const formattedTickets = booking.tickets.map((t) => {
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
        zoneName: t.zone.name,
        zoneColor: t.zone.colorCode,
        isVvip: t.isVvip,
        qrHash: t.qrHash,
        qrPayload,
        isRedeemed: !!t.redemption,
        redeemedAt: t.redemption?.redeemedAt || null,
      };
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingRef: booking.bookingRef,
        buyerName: booking.buyerName,
        buyerEmail: booking.buyerEmail,
        buyerPhone: booking.buyerPhone,
        totalAmount: booking.totalAmount,
        status: booking.status,
        createdAt: booking.createdAt,
        event: {
          id: booking.event.id,
          title: booking.event.title,
          date: booking.event.date,
          location: booking.event.location,
        },
        tickets: formattedTickets,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch booking passes' },
      { status: 500 }
    );
  }
}

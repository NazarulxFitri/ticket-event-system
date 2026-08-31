import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // Check if code is a JSON string from QR scanner
    if (code.startsWith('{') && code.endsWith('}')) {
      try {
        parsedPayload = JSON.parse(code);
        if (parsedPayload.ticketId) {
          searchId = parsedPayload.ticketId;
        }
      } catch (e) {
        // Ignore parse error, proceed with raw string search
      }
    }

    // Lookup by ID, ticketNumber, or IC
    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [
          { id: searchId },
          { ticketNumber: searchId.toUpperCase() },
          { icPassport: searchId.toUpperCase() },
        ],
      },
      include: {
        zone: true,
        redemption: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'No ticket found matching the provided QR or search code.' },
        { status: 444 }
      );
    }

    let isAuthentic = true;
    if (parsedPayload && parsedPayload.hash) {
      try {
        isAuthentic = verifyQrHash(ticket.id, ticket.icPassport, parsedPayload.hash);
      } catch (err) {
        isAuthentic = false;
      }
    }

    const isRedeemed = !!ticket.redemption;

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
        zoneName: ticket.zone.name,
        zoneColor: ticket.zone.colorCode,
        isVvip: ticket.isVvip,
        status: ticket.status,
        createdAt: ticket.createdAt,
        redemption: ticket.redemption
          ? {
              id: ticket.redemption.id,
              redeemedAt: ticket.redemption.redeemedAt,
              redeemedBy: ticket.redemption.redeemedBy,
              notes: ticket.redemption.notes,
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

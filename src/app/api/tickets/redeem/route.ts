import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, staffName, notes } = body;

    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: 'ticketId is required for wristband redemption.' },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { redemption: true, zone: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found.' },
        { status: 404 }
      );
    }

    if (ticket.redemption) {
      return NextResponse.json(
        {
          success: false,
          error: `Wristband ALREADY REDEEMED on ${new Date(ticket.redemption.redeemedAt).toLocaleString()} by ${ticket.redemption.redeemedBy}. Double redemption blocked!`,
          redemption: ticket.redemption,
        },
        { status: 409 } // Conflict
      );
    }

    const newRedemption = await prisma.redemption.create({
      data: {
        ticketId: ticket.id,
        redeemedBy: (staffName || 'Staff Gate 1').trim(),
        notes: (notes || `Wristband & Size ${ticket.tshirtSize} T-Shirt distributed`).trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Wristband and Size ${ticket.tshirtSize} T-Shirt successfully marked as REDEEMED for ${ticket.fullName}!`,
      redemption: newRedemption,
      guest: {
        fullName: ticket.fullName,
        tshirtSize: ticket.tshirtSize,
        zoneName: ticket.zone.name,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to redeem ticket' },
      { status: 500 }
    );
  }
}

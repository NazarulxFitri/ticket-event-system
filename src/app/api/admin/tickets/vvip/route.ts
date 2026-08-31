import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQrHash, generateShortTicketNumber } from '@/lib/crypto';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, phone, icPassport, tshirtSize, notes } = body;

    if (!fullName || !icPassport || !tshirtSize) {
      return NextResponse.json(
        { success: false, error: 'fullName, icPassport, and tshirtSize are required.' },
        { status: 400 }
      );
    }

    const formattedIc = icPassport.trim().toUpperCase();

    // Find or get VVIP Zone
    let vvipZone = await prisma.zone.findFirst({
      where: { name: { contains: 'VVIP' } },
    });

    if (!vvipZone) {
      vvipZone = await prisma.zone.create({
        data: {
          name: 'VVIP / Artiste Pass',
          description: 'Complimentary guest & artiste pass',
          price: 0,
          capacity: 100,
          colorCode: '#F59E0B',
        },
      });
    }

    const newId = crypto.randomUUID();
    const qrHash = generateQrHash(newId, formattedIc);
    const ticketNumber = generateShortTicketNumber();

    const ticket = await prisma.ticket.create({
      data: {
        id: newId,
        ticketNumber,
        fullName: fullName.trim(),
        phone: (phone || 'N/A').trim(),
        icPassport: formattedIc,
        tshirtSize,
        zoneId: vvipZone.id,
        isVvip: true,
        status: 'CONFIRMED',
        qrHash,
      },
      include: {
        zone: true,
      },
    });

    const qrPayload = JSON.stringify({
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      icPassport: ticket.icPassport,
      hash: ticket.qrHash,
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        fullName: ticket.fullName,
        phone: ticket.phone,
        icPassport: ticket.icPassport,
        tshirtSize: ticket.tshirtSize,
        zoneName: ticket.zone.name,
        zoneColor: ticket.zone.colorCode,
        isVvip: true,
        qrHash: ticket.qrHash,
        qrPayload,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to issue VVIP ticket' },
      { status: 500 }
    );
  }
}

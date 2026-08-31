import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQrHash, generateShortTicketNumber } from '@/lib/crypto';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, phone, icPassport, tshirtSize, zoneId } = body;

    // Validation
    if (!fullName || !phone || !icPassport || !tshirtSize || !zoneId) {
      return NextResponse.json(
        { success: false, error: 'All fields (fullName, phone, icPassport, tshirtSize, zoneId) are required.' },
        { status: 400 }
      );
    }

    const validSizes = ['S', 'M', 'L', 'XL', 'XXL'];
    if (!validSizes.includes(tshirtSize)) {
      return NextResponse.json(
        { success: false, error: 'Invalid T-shirt size. Must be S, M, L, XL, or XXL.' },
        { status: 400 }
      );
    }

    const formattedIc = icPassport.trim().toUpperCase();

    // Atomic transaction for capacity check & booking
    const ticket = await prisma.$transaction(async (tx) => {
      const zone = await tx.zone.findUnique({
        where: { id: zoneId },
        include: {
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

      const bookedCount = zone._count.tickets;
      if (bookedCount >= zone.capacity) {
        throw new Error(`The ${zone.name} zone is fully sold out!`);
      }

      const newId = crypto.randomUUID();
      const qrHash = generateQrHash(newId, formattedIc);
      const ticketNumber = generateShortTicketNumber();

      const createdTicket = await tx.ticket.create({
        data: {
          id: newId,
          ticketNumber,
          fullName: fullName.trim(),
          phone: phone.trim(),
          icPassport: formattedIc,
          tshirtSize,
          zoneId: zone.id,
          isVvip: false,
          status: 'CONFIRMED',
          qrHash,
        },
        include: {
          zone: true,
        },
      });

      return createdTicket;
    });

    // Build QR payload JSON string that can be encoded in QR code
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
        isVvip: ticket.isVvip,
        qrHash: ticket.qrHash,
        qrPayload,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete booking' },
      { status: 400 }
    );
  }
}

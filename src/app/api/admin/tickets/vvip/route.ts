import { NextResponse } from 'next/server';
import { createVvipTicket } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, phone, icPassport, tshirtSize, eventId, notes } = body;

    if (!fullName || !icPassport || !tshirtSize) {
      return NextResponse.json(
        { success: false, error: 'fullName, icPassport, and tshirtSize are required.' },
        { status: 400 }
      );
    }

    const ticket = await createVvipTicket({
      fullName,
      phone,
      icPassport,
      tshirtSize,
      eventId,
      notes,
    });

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to issue VVIP ticket' },
      { status: 500 }
    );
  }
}

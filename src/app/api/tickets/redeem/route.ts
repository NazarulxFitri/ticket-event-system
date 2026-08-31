import { NextResponse } from 'next/server';
import { redeemTicket } from '@/lib/db';

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

    const result = await redeemTicket(ticketId, staffName, notes);

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          redemption: result.redemption || null,
        },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      redemption: result.redemption,
      guest: result.guest,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to redeem ticket' },
      { status: 500 }
    );
  }
}

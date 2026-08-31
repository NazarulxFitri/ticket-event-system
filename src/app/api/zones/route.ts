import { NextRequest, NextResponse } from 'next/server';
import { getZones } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    const zonesWithAvailable = await getZones(eventId);
    return NextResponse.json({ success: true, zones: zonesWithAvailable });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}

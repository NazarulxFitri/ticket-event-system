import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    const data = await getAnalytics(eventId);

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}

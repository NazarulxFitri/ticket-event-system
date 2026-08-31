import { NextRequest, NextResponse } from 'next/server';
import { getEvents, createEvent } from '@/lib/db';

export async function GET() {
  try {
    const formattedEvents = await getEvents();
    return NextResponse.json({ success: true, events: formattedEvents });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, description, date, location, bannerUrl, zones } = body;

    if (!title || !description || !date || !location) {
      return NextResponse.json(
        { success: false, error: 'Missing required event fields (title, description, date, location)' },
        { status: 400 }
      );
    }

    const event = await createEvent({
      title,
      slug,
      description,
      date,
      location,
      bannerUrl,
      zones,
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}

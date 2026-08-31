import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        zones: true,
        _count: {
          select: {
            tickets: {
              where: { status: 'CONFIRMED' },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    const formattedEvents = events.map((event) => {
      const minPrice = event.zones.length > 0
        ? Math.min(...event.zones.map((z) => z.price))
        : 0;
      const totalCapacity = event.zones.reduce((sum, z) => sum + z.capacity, 0);

      return {
        id: event.id,
        slug: event.slug,
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        bannerUrl: event.bannerUrl,
        status: event.status,
        minPrice,
        totalCapacity,
        bookedTickets: event._count.tickets,
        zonesCount: event.zones.length,
      };
    });

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

    const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const event = await prisma.event.create({
      data: {
        title,
        slug: generatedSlug,
        description,
        date: new Date(date),
        location,
        bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
        status: 'ACTIVE',
        zones: {
          create: zones && Array.isArray(zones) && zones.length > 0 ? zones.map((z: any) => ({
            name: z.name,
            description: z.description || '',
            price: parseFloat(z.price) || 0,
            capacity: parseInt(z.capacity) || 100,
            colorCode: z.colorCode || '#3B82F6',
          })) : [
            {
              name: 'VIP Category',
              description: 'Front stage VIP access & merch pack',
              price: 250,
              capacity: 100,
              colorCode: '#8B5CF6',
            },
            {
              name: 'Standard Seat',
              description: 'Numbered tier 2 seating area',
              price: 120,
              capacity: 300,
              colorCode: '#3B82F6',
            },
            {
              name: 'Standing Arena',
              description: 'Main floor standing arena',
              price: 80,
              capacity: 500,
              colorCode: '#10B981',
            },
          ],
        },
      },
      include: {
        zones: true,
      },
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id },
        ],
      },
      include: {
        zones: {
          include: {
            _count: {
              select: {
                tickets: {
                  where: { status: 'CONFIRMED' },
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const zonesWithAvailability = event.zones.map((z) => {
      const booked = z._count.tickets;
      const remaining = Math.max(0, z.capacity - booked);
      return {
        id: z.id,
        name: z.name,
        description: z.description,
        price: z.price,
        capacity: z.capacity,
        bookedCount: booked,
        remainingCapacity: remaining,
        colorCode: z.colorCode,
        isSoldOut: remaining === 0,
      };
    });

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        slug: event.slug,
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        bannerUrl: event.bannerUrl,
        status: event.status,
        zones: zonesWithAvailability,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch event details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, date, location, bannerUrl, status, newZone } = body;

    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Update event fields
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(location && { location }),
        ...(bannerUrl && { bannerUrl }),
        ...(status && { status }),
      },
      include: { zones: true },
    });

    // If newZone payload is sent, create that zone for this event
    if (newZone && newZone.name) {
      await prisma.zone.create({
        data: {
          name: newZone.name,
          description: newZone.description || '',
          price: parseFloat(newZone.price) || 0,
          capacity: parseInt(newZone.capacity) || 100,
          colorCode: newZone.colorCode || '#3B82F6',
          eventId: id,
        },
      });
    }

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update event' },
      { status: 500 }
    );
  }
}

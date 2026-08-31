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

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        _count: {
          select: {
            tickets: {
              where: { status: 'CONFIRMED' },
            },
          },
        },
      },
      orderBy: { price: 'desc' },
    });

    const zonesWithAvailable = zones.map((z) => {
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

    return NextResponse.json({ success: true, zones: zonesWithAvailable });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    const ticketFilter = eventId ? { eventId, status: 'CONFIRMED' } : { status: 'CONFIRMED' };
    const zoneFilter = eventId ? { eventId } : {};

    const [events, totalTickets, totalRedeemed, zones, tshirtCountsRaw, recentTickets] = await Promise.all([
      prisma.event.findMany({ orderBy: { date: 'asc' } }),
      prisma.ticket.count({ where: ticketFilter }),
      prisma.redemption.count({
        where: eventId
          ? {
              ticket: { eventId },
            }
          : {},
      }),
      prisma.zone.findMany({
        where: zoneFilter,
        include: {
          event: { select: { title: true } },
          _count: {
            select: { tickets: { where: { status: 'CONFIRMED' } } },
          },
        },
      }),
      prisma.ticket.groupBy({
        by: ['tshirtSize'],
        where: ticketFilter,
        _count: { _all: true },
      }),
      prisma.ticket.findMany({
        where: eventId ? { eventId } : {},
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: { zone: true, event: true, redemption: true, booking: true },
      }),
    ]);

    // Format T-shirt size aggregation (S, M, L, XL, XXL)
    const tshirtBreakdown: Record<string, number> = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
    tshirtCountsRaw.forEach((item) => {
      if (tshirtBreakdown.hasOwnProperty(item.tshirtSize)) {
        tshirtBreakdown[item.tshirtSize] = item._count._all;
      }
    });

    // Calculate revenue & zone breakdown
    let totalRevenue = 0;
    const zoneBreakdown = zones.map((z) => {
      const sold = z._count.tickets;
      const revenue = sold * z.price;
      totalRevenue += revenue;
      return {
        id: z.id,
        name: z.name,
        eventTitle: z.event?.title,
        capacity: z.capacity,
        sold,
        remaining: Math.max(0, z.capacity - sold),
        price: z.price,
        revenue,
        colorCode: z.colorCode,
      };
    });

    const unredeemedCount = Math.max(0, totalTickets - totalRedeemed);
    const redemptionRate = totalTickets > 0 ? Math.round((totalRedeemed / totalTickets) * 100) : 0;

    return NextResponse.json({
      success: true,
      events: events.map((e) => ({ id: e.id, title: e.title, slug: e.slug })),
      selectedEventId: eventId || null,
      analytics: {
        totalTickets,
        totalRedeemed,
        unredeemedCount,
        redemptionRate,
        totalRevenue,
        tshirtBreakdown,
        zoneBreakdown,
        recentTickets: recentTickets.map((t) => ({
          id: t.id,
          ticketNumber: t.ticketNumber,
          fullName: t.fullName,
          phone: t.phone,
          icPassport: t.icPassport,
          tshirtSize: t.tshirtSize,
          zoneName: t.zone.name,
          eventTitle: t.event?.title,
          bookingRef: t.booking?.bookingRef || null,
          zoneColor: t.zone.colorCode,
          isVvip: t.isVvip,
          isRedeemed: !!t.redemption,
          redeemedAt: t.redemption?.redeemedAt || null,
          createdAt: t.createdAt,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}

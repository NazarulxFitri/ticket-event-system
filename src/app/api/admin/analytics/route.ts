import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [totalTickets, totalRedeemed, zones, tshirtCountsRaw, recentTickets] = await Promise.all([
      prisma.ticket.count({ where: { status: 'CONFIRMED' } }),
      prisma.redemption.count(),
      prisma.zone.findMany({
        include: {
          _count: {
            select: { tickets: { where: { status: 'CONFIRMED' } } },
          },
        },
      }),
      prisma.ticket.groupBy({
        by: ['tshirtSize'],
        where: { status: 'CONFIRMED' },
        _count: { _all: true },
      }),
      prisma.ticket.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { zone: true, redemption: true },
      }),
    ]);

    // Format T-shirt size aggregation (S, M, L, XL, XXL)
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
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

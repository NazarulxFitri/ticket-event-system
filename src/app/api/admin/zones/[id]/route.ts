import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, price, capacity, colorCode, description } = body;

    const existingZone = await prisma.zone.findUnique({ where: { id } });
    if (!existingZone) {
      return NextResponse.json(
        { success: false, error: 'Zone not found' },
        { status: 404 }
      );
    }

    const updatedZone = await prisma.zone.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(capacity !== undefined && { capacity: parseInt(capacity) }),
        ...(colorCode && { colorCode }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({ success: true, zone: updatedZone });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update zone quota' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { updateZone } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, price, capacity, colorCode, description } = body;

    const updatedZone = await updateZone(id, {
      name,
      price: price !== undefined ? parseFloat(price) : undefined,
      capacity: capacity !== undefined ? parseInt(capacity) : undefined,
      colorCode,
      description,
    });

    if (!updatedZone) {
      return NextResponse.json(
        { success: false, error: 'Zone not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, zone: updatedZone });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update zone quota' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getExportData } from '@/lib/db';

export async function GET() {
  try {
    const tickets = await getExportData();

    const headers = [
      'Ticket Number',
      'Ticket UUID',
      'Full Name',
      'Phone',
      'IC/Passport',
      'T-Shirt Size',
      'Zone',
      'VVIP Flag',
      'Redemption Status',
      'Redeemed At',
      'Redeemed By',
      'Notes',
      'Booking Date',
    ];

    const rows = tickets.map((t) => [
      `"${t.ticketNumber}"`,
      `"${t.id}"`,
      `"${t.fullName.replace(/"/g, '""')}"`,
      `"${t.phone}"`,
      `"${t.icPassport}"`,
      `"${t.tshirtSize}"`,
      `"${t.zoneName}"`,
      t.isVvip ? 'YES' : 'NO',
      t.redemption ? 'REDEEMED' : 'UNREDEEMED',
      t.redemption ? `"${new Date(t.redemption.redeemedAt).toISOString()}"` : 'N/A',
      t.redemption ? `"${t.redemption.redeemedBy}"` : 'N/A',
      t.redemption ? `"${(t.redemption.notes || '').replace(/"/g, '""')}"` : 'N/A',
      `"${new Date(t.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="event_guests_redemptions_${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Export failed' },
      { status: 500 }
    );
  }
}

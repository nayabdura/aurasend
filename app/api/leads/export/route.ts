import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function GET() {
    try {
        const userId = await getEffectiveUserId();

        let query = "SELECT * FROM leads";
        const params: any[] = [];
        if (userId) {
            query += " WHERE user_id = ?";
            params.push(userId);
        }
        query += " ORDER BY id DESC";

        const leads = db.prepare(query).all(...params);

        // Generate CSV with timestamps
        const header = 'Name,Email,Website,Company,Type,Status,Sent At,Opened At,Replied At,Followup1 At,Followup2 At\n';
        const rows = leads.map((lead: any) => {
            const sentAt = lead.sent_at ? new Date(lead.sent_at).toISOString() : '';
            const openedAt = lead.opened_at ? new Date(lead.opened_at).toISOString() : '';
            const repliedAt = lead.replied_at ? new Date(lead.replied_at).toISOString() : '';
            const f1 = lead.followup1_sent_at ? new Date(lead.followup1_sent_at).toISOString() : '';
            const f2 = lead.followup2_sent_at ? new Date(lead.followup2_sent_at).toISOString() : '';

            return `${lead.name || ''},${lead.email},${lead.website || ''},${lead.company || ''},${lead.lead_type || 'client'},${lead.status},${sentAt},${openedAt},${repliedAt},${f1},${f2}`;
        }).join('\n');

        const csv = header + rows;

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="leads_updated.csv"'
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 });
    }
}

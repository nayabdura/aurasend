import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function GET() {
    try {
        const userId = await getEffectiveUserId();

        let query = "SELECT * FROM invalid_leads";
        const params: any[] = [];
        if (userId) {
            query += " WHERE user_id = ?";
            params.push(userId);
        }
        query += " ORDER BY created_at DESC";

        const invalids = db.prepare(query).all(...params);

        // Generate CSV
        const header = 'Email,Name,Reason\n';
        const rows = invalids.map((inv: any) => `${inv.email},${inv.name || ''},${inv.reason}`).join('\n');
        const csv = header + rows;

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="invalid_leads.csv"'
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 401 });
    }
}

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function GET() {
    try {
        const userId = await getEffectiveUserId();

        let query = `
            SELECT e.*, 
                   l.email as lead_email, l.name as lead_name, 
                   g.email as gmail_address, c.name as campaign_name
            FROM email_logs e
            LEFT JOIN leads l ON e.lead_id = l.id
            LEFT JOIN gmail_accounts g ON e.gmail_id = g.id
            LEFT JOIN campaigns c ON l.campaign_id = c.id
        `;
        const params: any[] = [];

        if (userId) {
            query += ` WHERE e.user_id = ?`;
            params.push(userId);
        }

        query += ` ORDER BY e.timestamp DESC LIMIT 200`;

        const logs = db.prepare(query).all(...params);
        return NextResponse.json(logs);
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

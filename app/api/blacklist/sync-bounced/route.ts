
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function POST() {
    try {
        const userId = await getEffectiveUserId();

        // Build query
        let query = "SELECT DISTINCT email, user_id FROM leads WHERE (status = 'bounced' OR is_valid = 0)";
        const params: any[] = [];
        if (userId) {
            query += " AND user_id = ?";
            params.push(userId);
        }

        const bouncedLeads = db.prepare(query).all(...params) as { email: string, user_id: number }[];

        let added = 0;
        for (const lead of bouncedLeads) {
            try {
                // If userId is null (master), use the lead's owner user_id to insert into blacklist
                const insertUserId = userId || lead.user_id;
                db.prepare('INSERT INTO blacklist (user_id, email, reason) VALUES (?, ?, ?)').run(insertUserId, lead.email.toLowerCase(), 'bounced');
                added++;
            } catch (e) {
                // Already exists, skip
            }
        }

        return NextResponse.json({ success: true, added });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 });
    }
}

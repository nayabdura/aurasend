import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/follow-ups?campaign_id=X
export async function GET(req: Request) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(req.url);
        const campaignId = searchParams.get('campaign_id');

        let query = `
            SELECT f.*, t.name as template_name, t.subject as template_subject
            FROM follow_ups f
            LEFT JOIN templates t ON f.template_id = t.id
            WHERE f.user_id = ?
        `;
        const params: any[] = [user.id];

        if (campaignId) {
            query += ' AND f.campaign_id = ?';
            params.push(campaignId);
        }

        query += ' ORDER BY f.campaign_id, f.step_number ASC';
        const followUps = db.prepare(query).all(...params);

        return NextResponse.json(followUps);
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

// POST /api/follow-ups - create follow-up
export async function POST(req: Request) {
    try {
        const user = await requireAuth();
        const body = await req.json();
        const { campaign_id, step_number, delay_days, delay_hours, send_time, subject, body: bodyText, template_id, stop_on_reply, stop_on_bounce } = body;

        if (!campaign_id) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 });

        // Verify campaign belongs to user
        const camp = db.prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?').get(campaign_id, user.id);
        if (!camp) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

        const result = db.prepare(`
            INSERT INTO follow_ups (user_id, campaign_id, step_number, delay_days, delay_hours, send_time, subject, body, template_id, stop_on_reply, stop_on_bounce)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            user.id, campaign_id,
            step_number || 1, delay_days || 3, delay_hours || 0,
            send_time || '09:00', subject || '', bodyText || '',
            template_id || null,
            stop_on_reply !== false ? 1 : 0,
            stop_on_bounce !== false ? 1 : 0
        );

        return NextResponse.json({ id: result.lastInsertRowid, success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const user = await requireAuth();
        const body = await req.json();

        const existing = db.prepare('SELECT id FROM follow_ups WHERE id = ? AND user_id = ?').get(params.id, user.id);
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const { delay_days, delay_hours, send_time, subject, body: bodyText, template_id, stop_on_reply, stop_on_bounce } = body;

        db.prepare(`
            UPDATE follow_ups SET delay_days = ?, delay_hours = ?, send_time = ?, subject = ?, body = ?, template_id = ?, stop_on_reply = ?, stop_on_bounce = ?
            WHERE id = ? AND user_id = ?
        `).run(delay_days || 3, delay_hours || 0, send_time || '09:00', subject || '', bodyText || '', template_id || null, stop_on_reply !== false ? 1 : 0, stop_on_bounce !== false ? 1 : 0, params.id, user.id);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const user = await requireAuth();
        db.prepare('DELETE FROM follow_ups WHERE id = ? AND user_id = ?').run(params.id, user.id);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

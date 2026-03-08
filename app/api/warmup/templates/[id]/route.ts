import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const userId = await getEffectiveUserId();
        const { id } = params;
        const {
            gmail_account_id, name, subject, body,
            followup1_subject, followup1_body,
            followup2_subject, followup2_body,
            rotation_order, is_active
        } = await req.json();

        // Ownership check
        if (userId) {
            const existing = db.prepare('SELECT id FROM warmup_templates WHERE id = ? AND user_id = ?').get(id, userId);
            if (!existing) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        db.prepare(`
            UPDATE warmup_templates SET
                gmail_account_id = COALESCE(?, gmail_account_id),
                name = COALESCE(?, name),
                subject = COALESCE(?, subject),
                body = COALESCE(?, body),
                followup1_subject = ?,
                followup1_body = ?,
                followup2_subject = ?,
                followup2_body = ?,
                rotation_order = COALESCE(?, rotation_order),
                is_active = COALESCE(?, is_active)
            WHERE id = ?
        `).run(
            gmail_account_id ?? null,
            name ?? null, subject ?? null, body ?? null,
            followup1_subject ?? null, followup1_body ?? null,
            followup2_subject ?? null, followup2_body ?? null,
            rotation_order ?? null, is_active ?? null,
            id
        );

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const userId = await getEffectiveUserId();
        const { id } = params;

        let result;
        if (userId) {
            result = db.prepare('DELETE FROM warmup_templates WHERE id = ? AND user_id = ?').run(id, userId);
        } else {
            result = db.prepare('DELETE FROM warmup_templates WHERE id = ?').run(id);
        }

        if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

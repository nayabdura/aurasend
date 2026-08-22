import { NextResponse } from 'next/server';
import { requireAuth, getEffectiveUserId } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await requireAuth();
        const userId = await getEffectiveUserId();

        const result = db.prepare('DELETE FROM contacts WHERE id = ? AND (? IS NULL OR user_id = ?)').run(params.id, userId, userId);
        db.prepare('DELETE FROM enriched_contacts WHERE id = ? AND (? IS NULL OR user_id = ?)').run(params.id, userId, userId);

        if (result.changes === 0) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        await requireAuth();
        const userId = await getEffectiveUserId();
        const { email, phone, validation_status } = await req.json();

        const result = db.prepare(`
            UPDATE enriched_contacts 
            SET email = ?, phone = ?, validation_status = ? 
            WHERE id = ? AND (? IS NULL OR user_id = ?)
        `).run(email, phone, validation_status, params.id, userId, userId);

        if (result.changes === 0) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

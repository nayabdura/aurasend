import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const user = await requireAuth();
        const { is_read } = await req.json();

        db.prepare(`
            UPDATE reply_threads SET is_read = ? WHERE id = ? AND user_id = ?
        `).run(is_read ? 1 : 0, params.id, user.id);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const user = await requireAuth();
        const result = db.prepare(`
            DELETE FROM reply_threads WHERE id = ? AND user_id = ?
        `).run(params.id, user.id);

        if (result.changes === 0) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

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
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

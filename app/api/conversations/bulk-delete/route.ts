import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(req: Request) {
    try {
        const user = await requireAuth();
        const { ids } = await req.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No conversation IDs provided' }, { status: 400 });
        }

        const deleteStmt = db.prepare("DELETE FROM reply_threads WHERE id = ? AND user_id = ?");

        const deleteTransaction = db.transaction((threadIds: string[]) => {
            let deletedCount = 0;
            for (const id of threadIds) {
                const res = deleteStmt.run(id, user.id);
                if (res.changes > 0) {
                    deletedCount++;
                }
            }
            return deletedCount;
        });

        const count = deleteTransaction(ids);

        return NextResponse.json({ success: true, count });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

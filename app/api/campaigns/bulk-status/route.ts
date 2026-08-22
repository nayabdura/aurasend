import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const userId = await getEffectiveUserId();
        const { ids, status } = await req.json();

        if (!status || (status !== 'running' && status !== 'paused')) {
            return NextResponse.json({ error: 'Invalid status. Must be "running" or "paused"' }, { status: 400 });
        }

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No campaign IDs provided' }, { status: 400 });
        }

        const updateStmt = userId
            ? db.prepare("UPDATE campaigns SET status = ? WHERE id = ? AND user_id = ?")
            : db.prepare("UPDATE campaigns SET status = ? WHERE id = ?");

        const statusTransaction = db.transaction((campaignIds: string[], newStatus: string) => {
            let updatedCount = 0;
            for (const id of campaignIds) {
                const res = userId ? updateStmt.run(newStatus, id, userId) : updateStmt.run(newStatus, id);
                if (res.changes > 0) {
                    updatedCount++;
                }
            }
            return updatedCount;
        });

        const count = statusTransaction(ids, status);

        return NextResponse.json({ success: true, count });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

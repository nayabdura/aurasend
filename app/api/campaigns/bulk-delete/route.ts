import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const userId = await getEffectiveUserId();
        const { ids } = await req.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No campaign IDs provided' }, { status: 400 });
        }

        const deleteStmt = userId
            ? db.prepare("DELETE FROM campaigns WHERE id = ? AND user_id = ?")
            : db.prepare("DELETE FROM campaigns WHERE id = ?");

        const deleteAccounts = db.prepare("DELETE FROM campaign_accounts WHERE campaign_id = ?");
        const nullLeads = db.prepare("UPDATE leads SET campaign_id = NULL WHERE campaign_id = ?");

        const deleteTransaction = db.transaction((campaignIds: string[]) => {
            let deletedCount = 0;
            for (const id of campaignIds) {
                const res = userId ? deleteStmt.run(id, userId) : deleteStmt.run(id);
                if (res.changes > 0) {
                    deleteAccounts.run(id);
                    nullLeads.run(id);
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

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

// POST /api/warmup/assign  { gmail_account_id, warmup_template_id }
export async function POST(req: Request) {
    try {
        const userId = await getEffectiveUserId();
        const { gmail_account_id, warmup_template_id } = await req.json();

        if (!gmail_account_id) {
            return NextResponse.json({ error: 'gmail_account_id is required' }, { status: 400 });
        }

        // Ownership check
        if (userId) {
            const account = db.prepare('SELECT id FROM gmail_accounts WHERE id = ? AND user_id = ?').get(gmail_account_id, userId);
            if (!account) return NextResponse.json({ error: 'Account not found or unauthorized' }, { status: 404 });
        }

        db.prepare('UPDATE gmail_accounts SET warmup_template_id = ? WHERE id = ?')
            .run(warmup_template_id || null, gmail_account_id);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

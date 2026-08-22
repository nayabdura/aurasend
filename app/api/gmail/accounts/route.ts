
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function GET() {
    try {
        const userId = await getEffectiveUserId();

        // Strict isolation: filter by user_id
        let query = "SELECT id, email, status, daily_limit, sent_today FROM gmail_accounts WHERE status != 'deleted'";
        const params: any[] = [];

        if (userId) {
            query += " AND user_id = ?";
            params.push(userId);
        }

        const accounts = db.prepare(query).all(...params);
        return NextResponse.json(accounts);
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

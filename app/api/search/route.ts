import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const q = `%${query}%`;
        const results: any[] = [];

        // Search Leads
        const leads = db.prepare(`
            SELECT id, name as title, email as subtitle, 'lead' as type, '/leads' as url
            FROM leads 
            WHERE user_id = ? AND (name LIKE ? OR email LIKE ?)
            LIMIT 5
        `).all(user.id, q, q);
        results.push(...leads);

        // Search Campaigns
        const campaigns = db.prepare(`
            SELECT id, name as title, status as subtitle, 'campaign' as type, '/campaigns' as url
            FROM campaigns
            WHERE user_id = ? AND name LIKE ?
            LIMIT 5
        `).all(user.id, q);
        results.push(...campaigns);

        // Search Gmail Accounts
        const accounts = db.prepare(`
            SELECT id, email as title, status as subtitle, 'gmail' as type, '/gmail' as url
            FROM gmail_accounts
            WHERE user_id = ? AND email LIKE ?
            LIMIT 3
        `).all(user.id, q);
        // Map account type icon if needed on frontend, currently using default in Palette
        results.push(...accounts);

        return NextResponse.json({ results });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

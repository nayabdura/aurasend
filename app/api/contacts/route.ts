import { NextResponse } from 'next/server';
import { requireAuth, getEffectiveUserId, getUserId } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/contacts - list all contacts
export async function GET(req: Request) {
    try {
        const userId = await getEffectiveUserId();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = `
            SELECT c.*, camp.name as campaign_name
            FROM contacts c
            LEFT JOIN campaigns camp ON c.campaign_id = camp.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (userId) {
            query += " AND c.user_id = ?";
            params.push(userId);
        }

        if (search) {
            query += ` AND (c.email LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.company LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status) {
            query += ` AND c.reply_status = ?`;
            params.push(status);
        }

        query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const contacts = db.prepare(query).all(...params);
        let countQuery = `SELECT COUNT(*) as c FROM contacts WHERE 1=1`;
        const countParams: any[] = [];
        if (userId) {
            countQuery += ` AND user_id = ?`;
            countParams.push(userId);
        }
        const total = (db.prepare(countQuery).get(...countParams) as any)?.c || 0;

        return NextResponse.json({ contacts, total });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

// POST /api/contacts - create contact
export async function POST(req: Request) {
    try {
        await requireAuth();
        const userId = await getUserId();
        const body = await req.json();
        const { email, first_name, last_name, company, current_role, campaign_id } = body;

        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

        const result = db.prepare(`
            INSERT OR REPLACE INTO contacts (user_id, email, first_name, last_name, company, current_role, campaign_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(userId, email.toLowerCase(), first_name || '', last_name || '', company || '', current_role || '', campaign_id || null);

        return NextResponse.json({ id: result.lastInsertRowid, success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

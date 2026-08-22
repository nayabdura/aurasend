import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId, getUserId } from '@/lib/auth';

// GET /api/warmup/templates?gmail_id=X
export async function GET(req: Request) {
    try {
        const userId = await getEffectiveUserId();
        const { searchParams } = new URL(req.url);
        const gmailId = searchParams.get('gmail_id');

        let query = 'SELECT * FROM warmup_templates';
        const params: any[] = [];
        const conditions: string[] = [];

        if (userId) conditions.push('user_id = ?'), params.push(userId);
        if (gmailId) conditions.push('(gmail_account_id = ? OR gmail_account_id IS NULL)'), params.push(parseInt(gmailId));

        if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY gmail_account_id ASC, rotation_order ASC, created_at DESC';

        const templates = db.prepare(query).all(...params);
        return NextResponse.json(templates);
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

// POST /api/warmup/templates
export async function POST(req: Request) {
    try {
        const userId = await getUserId();
        const {
            gmail_account_id, name, subject, body,
            followup1_subject, followup1_body,
            followup2_subject, followup2_body,
            rotation_order
        } = await req.json();

        if (!name || !subject || !body) {
            return NextResponse.json({ error: 'name, subject, body are required' }, { status: 400 });
        }

        const result = db.prepare(`
            INSERT INTO warmup_templates 
            (user_id, gmail_account_id, name, subject, body, followup1_subject, followup1_body, followup2_subject, followup2_body, rotation_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            userId,
            gmail_account_id || null,
            name, subject, body,
            followup1_subject || null,
            followup1_body || null,
            followup2_subject || null,
            followup2_body || null,
            rotation_order || 0
        );

        return NextResponse.json({ success: true, id: result.lastInsertRowid });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

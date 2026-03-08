import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function GET() {
    try {
        const userId = await getEffectiveUserId();

        // Build query based on user role
        let query = `
            SELECT id, name, email, company, website, status, opened, replied, 
                   sent_at, opened_at, replied_at, campaign_id, lead_type, user_id
            FROM leads 
        `;

        const params: any[] = [];

        if (userId) {
            query += ' WHERE user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY id DESC LIMIT 1000';

        const leads = db.prepare(query).all(...params);
        return NextResponse.json(leads);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 401 });
    }
}

export async function DELETE(req: Request) {
    const userId = await getEffectiveUserId();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const result = db.prepare('DELETE FROM leads WHERE id = ? AND user_id = ?').run(id, userId);

    if (result.changes === 0) {
        return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}

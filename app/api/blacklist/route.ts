import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId, getUserId } from '@/lib/auth';

// Create blacklist table if not exists (including user_id)
// Note: user_id column ADD was in lib/db.ts migration, so it should exist.

export async function GET() {
    try {
        const userId = await getEffectiveUserId();
        let query = 'SELECT * FROM blacklist';
        const params: any[] = [];

        if (userId) {
            query += ' WHERE user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY created_at DESC';
        const blacklist = db.prepare(query).all(...params);
        return NextResponse.json(blacklist);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getUserId();
        const { email, reason } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        db.prepare('INSERT INTO blacklist (user_id, email, reason) VALUES (?, ?, ?)').run(userId, email.toLowerCase(), reason || 'manual');
        return NextResponse.json({ success: true });
    } catch (e: any) {
        if (e.message.includes('UNIQUE')) {
            return NextResponse.json({ error: 'Email already blacklisted for this user' }, { status: 400 });
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const userId = await getEffectiveUserId();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        let result;
        if (userId) {
            result = db.prepare('DELETE FROM blacklist WHERE id = ? AND user_id = ?').run(id, userId);
        } else {
            result = db.prepare('DELETE FROM blacklist WHERE id = ?').run(id);
        }

        if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

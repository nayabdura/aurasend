import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId, getUserId } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const userId = await getUserId();
        const { type, content } = await req.json();

        if (!type || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        db.prepare("INSERT INTO training_blocks (user_id, type, content) VALUES (?, ?, ?)").run(userId, type, content);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const userId = await getEffectiveUserId();
        let query = "SELECT * FROM training_blocks";
        const params: any[] = [];

        if (userId) {
            query += " WHERE user_id = ?";
            params.push(userId);
        }

        query += " ORDER BY id DESC";

        const blocks = db.prepare(query).all(...params);
        return NextResponse.json(blocks);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const userId = await getEffectiveUserId();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        let result;
        if (userId) {
            result = db.prepare("DELETE FROM training_blocks WHERE id = ? AND user_id = ?").run(id, userId);
        } else {
            result = db.prepare("DELETE FROM training_blocks WHERE id = ?").run(id);
        }

        if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

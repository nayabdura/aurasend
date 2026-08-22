
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId, getUserId } from '@/lib/auth';

export async function GET() {
    try {
        const userId = await getEffectiveUserId();

        let query = "SELECT * FROM templates";
        const params: any[] = [];

        if (userId) {
            query += " WHERE user_id = ?";
            params.push(userId);
        }

        query += " ORDER BY created_at DESC";

        const templates = db.prepare(query).all(...params);
        return NextResponse.json(templates);
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getUserId(); // Strict ID for creation
        const { name, subject, body } = await req.json();

        if (!name || !subject || !body) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const result = db.prepare(
            "INSERT INTO templates (user_id, name, subject, body, created_at) VALUES (?, ?, ?, ?, ?)"
        ).run(userId, name, subject, body, new Date().toISOString());

        return NextResponse.json({ success: true, id: result.lastInsertRowid });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

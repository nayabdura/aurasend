import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const userId = await getEffectiveUserId();
        let template;

        if (userId) {
            template = db.prepare("SELECT * FROM templates WHERE id = ? AND user_id = ?").get(params.id, userId);
        } else {
            template = db.prepare("SELECT * FROM templates WHERE id = ?").get(params.id);
        }

        if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(template);
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 401 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const userId = await getEffectiveUserId();
        const { name, subject, body } = await req.json();

        if (userId) {
            const exists = db.prepare("SELECT id FROM templates WHERE id = ? AND user_id = ?").get(params.id, userId);
            if (!exists) return NextResponse.json({ error: 'Unauthorized or Not Found' }, { status: 404 });
        }

        db.prepare("UPDATE templates SET name = ?, subject = ?, body = ? WHERE id = ?")
            .run(name, subject, body, params.id);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const userId = await getEffectiveUserId();
        let result;

        if (userId) {
            result = db.prepare("DELETE FROM templates WHERE id = ? AND user_id = ?").run(params.id, userId);
        } else {
            result = db.prepare("DELETE FROM templates WHERE id = ?").run(params.id);
        }

        if (result.changes === 0) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}


import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const userId = await getEffectiveUserId();

        let result;
        if (userId) {
            // Regular user: only delete their own leads
            result = db.prepare('DELETE FROM leads WHERE id = ? AND user_id = ?').run(id, userId);
        } else {
            // Master: can delete any
            result = db.prepare('DELETE FROM leads WHERE id = ?').run(id);
        }

        if (result.changes === 0) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const userId = await getEffectiveUserId();

        let lead;
        if (userId) {
            lead = db.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').get(id, userId);
        } else {
            lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
        }

        if (!lead) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json(lead);
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

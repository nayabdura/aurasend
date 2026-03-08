import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db, { suppressEmail, isEmailSuppressed } from '@/lib/db';

// GET — list all suppressed emails (user's own)
export async function GET(request: Request) {
    try {
        const user = await requireAuth();

        // Master sees all, users see only their own
        const suppressed = user.role === 'master'
            ? db.prepare('SELECT * FROM global_suppression ORDER BY created_at DESC LIMIT 500').all()
            : db.prepare('SELECT * FROM global_suppression WHERE user_id = ? ORDER BY created_at DESC LIMIT 500').all(user.id);

        return NextResponse.json({ suppressed });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — add email(s) to suppression list manually
export async function POST(request: Request) {
    try {
        const user = await requireAuth();
        const data = await request.json();

        const emails: string[] = Array.isArray(data.emails)
            ? data.emails
            : data.email
                ? [data.email]
                : [];

        if (emails.length === 0) {
            return NextResponse.json({ error: 'No email provided' }, { status: 400 });
        }

        for (const email of emails) {
            suppressEmail(email.trim().toLowerCase(), data.reason || 'manual', user.id);
        }

        return NextResponse.json({ success: true, count: emails.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — remove from suppression list (admin only)
export async function DELETE(request: Request) {
    try {
        const user = await requireAuth();
        if (user.role !== 'master') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const { email } = await request.json();
        db.prepare('DELETE FROM global_suppression WHERE LOWER(email) = LOWER(?)').run(email);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

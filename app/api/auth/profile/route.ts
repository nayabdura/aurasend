import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';
import bcrypt from 'bcrypt';

export async function PUT(req: Request) {
    try {
        const user = await requireAuth();
        const { currentPassword, newPassword } = await req.json();

        if (currentPassword && newPassword) {
            // Let's verify password
            const userRec = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as any;
            if (!userRec || !(await bcrypt.compare(currentPassword, userRec.password_hash))) {
                return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
            }

            const hashed = await bcrypt.hash(newPassword, 10);
            db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashed, user.id);
            return NextResponse.json({ success: true, message: 'Password updated successfully' });
        }

        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const user = await requireAuth();

        const { currentPassword } = await req.json();

        const userRec = db.prepare('SELECT password_hash, role FROM users WHERE id = ?').get(user.id) as any;
        if (!userRec || !(await bcrypt.compare(currentPassword, userRec.password_hash))) {
            return NextResponse.json({ error: 'Incorrect password' }, { status: 400 });
        }

        if (userRec.role === 'master') {
            return NextResponse.json({ error: 'Master account cannot be deleted' }, { status: 403 });
        }

        db.transaction(() => {
            db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
            // the db should cascade safely; if not, we can delete dependent records manually if needed.
        })();

        const response = NextResponse.json({ success: true, message: 'Account deleted' });
        response.cookies.delete('auth_token');
        return response;
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

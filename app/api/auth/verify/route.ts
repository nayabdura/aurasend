import { NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { userId, code } = await req.json();

        if (!userId || !code) {
            return NextResponse.json({ error: 'User ID and code are required' }, { status: 400 });
        }

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.verify_code !== code) {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
        }

        // Mark as verified
        db.prepare("UPDATE users SET is_verified = 1, verify_code = NULL WHERE id = ?").run(user.id);

        // Create Session
        const token = await createToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            workspaceId: user.workspace_id
        });

        // Set cookie
        const cookieStore = cookies();
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return NextResponse.json({ success: true, message: 'Verified successfully' });

    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

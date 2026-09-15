import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import db from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const rawEmail = body.email;
        const password = body.password;
        const name = body.name ? String(body.name).trim() : undefined;

        if (!rawEmail || !password) {
            return NextResponse.json(
                { error: 'Email and password required' },
                { status: 400 }
            );
        }

        const email = String(rawEmail).toLowerCase().trim();

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Check if user already exists
        let existing: any = null;
        if (process.env.DATABASE_URL) {
            existing = await prisma.user.findUnique({ where: { email } });
        } else {
            existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        }

        if (existing) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 409 }
            );
        }

        const user = await registerUser(email, password, name);

        // Ensure user is marked verified in DB
        if (process.env.DATABASE_URL) {
            await prisma.user.update({
                where: { id: user.id },
                data: { isVerified: true, verifyCode: null }
            });
        } else {
            db.prepare('UPDATE users SET is_verified = 1, verify_code = NULL WHERE id = ?').run(user.id);
        }

        // Auto-login on registration
        const { createToken } = await import('@/lib/auth');
        const { cookies } = await import('next/headers');
        
        const token = await createToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            workspaceId: user.workspace_id || 1
        });

        const cookieStore = cookies();
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return NextResponse.json({
            success: true,
            user
        });
    } catch (e: any) {
        console.error('Signup error:', e);
        return NextResponse.json(
            { error: e?.message || 'An internal server error occurred.' },
            { status: 500 }
        );
    }
}

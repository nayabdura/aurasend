import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rateLimit';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        if (!process.env.DATABASE_URL) {
            return NextResponse.json(
                { error: 'Database connection string (DATABASE_URL) is missing in environment variables. Please add DATABASE_URL in Vercel Project Settings.' },
                { status: 500 }
            );
        }

        const rawIp = req.headers.get('x-forwarded-for') || req.headers.get('remote-addr') || 'unknown';
        const ip = rawIp.split(',')[0].trim();
        // Max 50 login attempts per IP per 10 minutes (generous threshold to prevent lockouts during setup)
        const allowed = checkRateLimit(`login_${ip}`, 50, 10 * 60 * 1000);
        
        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again later.' },
                { status: 429 }
            );
        }
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password required' },
                { status: 400 }
            );
        }

        const result = await loginUser(email, password);

        if (!result) {
            return NextResponse.json(
                { error: 'Invalid credentials. Please check your email and password.' },
                { status: 401 }
            );
        }

        if (result.user.is_verified === 0) {
            if (process.env.DATABASE_URL) {
                try {
                    await prisma.user.update({
                        where: { id: result.user.id },
                        data: { isVerified: true, verifyCode: null },
                    });
                } catch (e) {
                    console.error('Failed to update isVerified in Postgres:', e);
                }
            } else {
                const db = require('@/lib/db').default;
                db.prepare('UPDATE users SET is_verified = 1, verify_code = NULL WHERE id = ?').run(result.user.id);
            }
            result.user.is_verified = 1;
        }

        // Set cookie
        const cookieStore = cookies();
        cookieStore.set('auth_token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return NextResponse.json({
            success: true,
            user: result.user
        });
    } catch (e: any) {
        console.error('Login API error:', e);
        return NextResponse.json(
            { error: e?.message || 'An internal server error occurred.' },
            { status: 500 }
        );
    }
}

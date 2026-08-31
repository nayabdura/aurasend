import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rateLimit';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
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
            // Generate and send OTP again
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            if (process.env.DATABASE_URL) {
                try {
                    await prisma.user.update({
                        where: { id: result.user.id },
                        data: { verifyCode: otp },
                    });
                } catch (e) {
                    console.error('Failed to update verifyCode in Postgres:', e);
                }
            } else {
                const db = require('@/lib/db').default;
                db.prepare('UPDATE users SET verify_code = ? WHERE id = ?').run(otp, result.user.id);
            }

            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: Number(process.env.SMTP_PORT) || 587,
                secure: false, // true for 465
                auth: {
                    user: process.env.SYSTEM_EMAIL || 'nayabdura@gmail.com',
                    pass: process.env.SYSTEM_EMAIL_PASSWORD || 'uaub lvhw xruu ylry' // App Password for Gmail
                }
            });

            let emailFailed = false;
            try {
                await transporter.sendMail({
                    from: '"AuraSend Security" <nayabdura@gmail.com>',
                    to: email,
                    subject: 'AuraSend - Your Verification Code',
                    html: `
                        <div style="font-family: sans-serif; max-w-md mx-auto p-4">
                            <h2>Welcome back to AuraSend!</h2>
                            <p>To access your account, here is your email verification code:</p>
                            <h1 style="color: #4f46e5; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
                            <p>Please enter this code on the verification page.</p>
                        </div>
                    `
                });
                console.log(`[AuraSend Auth] Verification OTP sent successfully to ${email} for Login`);
            } catch (e: any) {
                emailFailed = true;
                console.error('\n==== SMTP DELIVERY FAILED ====');
                if (e.message.includes('Invalid login') || e.message.includes('BadCredentials')) {
                    console.error('ERROR: Gmail Authentication Failed. You MUST use a 16-character App Password instead of your regular Google password.');
                    console.error('See: https://myaccount.google.com/apppasswords');
                } else {
                    console.error('SMTP Error:', e.message);
                }
                console.log(`[AuraSend Auth] DEVELOPMENT FALLBACK -> OTP for ${email} is: ${otp}\n==============================\n`);
            }

            return NextResponse.json({
                success: true,
                requiresVerification: true,
                userId: result.user.id,
                email: result.user.email,
                devOtp: emailFailed ? otp : null
            });
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

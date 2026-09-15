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

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        if (process.env.DATABASE_URL) {
            await prisma.user.update({
                where: { id: user.id },
                data: { verifyCode: otp, isVerified: false }
            });
        } else {
            db.prepare('UPDATE users SET verify_code = ?, is_verified = 0 WHERE id = ?').run(otp, user.id);
        }

        // Send OTP
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false, // true for 465
            auth: {
                user: process.env.SYSTEM_EMAIL || 'nayabdura@gmail.com',
                pass: process.env.SYSTEM_EMAIL_PASSWORD || 'uaub lvhw xruu ylry' // Must be an App Password for Gmail!
            }
        });

        let emailFailed = false;

        try {
            await transporter.sendMail({
                from: '"AuraSend Security" <nayabdura@gmail.com>',
                to: email,
                subject: 'AuraSend - Your Verification Code',
                html: `
                    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
                        <h2 style="color: #1e293b;">Welcome to AuraSend!</h2>
                        <p style="color: #475569;">Your email verification code is:</p>
                        <h1 style="color: #4f46e5; letter-spacing: 6px; font-size: 36px; text-align: center; margin: 20px 0;">${otp}</h1>
                        <p style="color: #64748b; font-size: 14px;">Please enter this code on the verification page to complete your registration.</p>
                    </div>
                `
            });
            console.log(`[AuraSend Auth] Verification OTP sent successfully to ${email}`);
        } catch (e: any) {
            emailFailed = true;
            console.error('\n==== SMTP DELIVERY FAILED ====');
            if (e.message.includes('Invalid login') || e.message.includes('BadCredentials')) {
                console.error('ERROR: Gmail Authentication Failed. You MUST use a 16-character App Password instead of your regular Google password.');
            } else {
                console.error('SMTP Error:', e.message);
            }
            console.log(`[AuraSend Auth] DEVELOPMENT FALLBACK -> OTP for ${email} is: ${otp}\n==============================\n`);
        }

        // DO NOT CREATE SESSION YET - must verify first
        return NextResponse.json({
            success: true,
            requiresVerification: true,
            userId: user.id,
            email: user.email,
            devOtp: emailFailed ? otp : null
        });
    } catch (e: any) {
        console.error('Signup error:', e);
        return NextResponse.json(
            { error: e?.message || 'An internal server error occurred.' },
            { status: 500 }
        );
    }
}

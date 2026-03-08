import { NextResponse } from 'next/server';
import { registerUser, createToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { email, password, name } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const db = require('@/lib/db').default;
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

        if (existing) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 409 }
            );
        }

        const user = await registerUser(email, password, name);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        db.prepare('UPDATE users SET verify_code = ?, is_verified = 0 WHERE id = ?').run(otp, user.id);

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
                    <div style="font-family: sans-serif; max-w-md mx-auto p-4">
                        <h2>Welcome to AuraSend!</h2>
                        <p>Your email verification code is:</p>
                        <h1 style="color: #4f46e5; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
                        <p>Please enter this code on the verification page to complete your registration.</p>
                    </div>
                `
            });
            console.log(`[AuraSend Auth] Verification OTP sent successfully to ${email}`);
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

        // DO NOT CREATE SESSION YET - must verify first
        return NextResponse.json({
            success: true,
            requiresVerification: true,
            userId: user.id,
            email: user.email,
            devOtp: emailFailed ? otp : null
        });
    } catch (e: any) {
        return NextResponse.json(
            { error: e.message || 'Signup failed' },
            { status: 500 }
        );
    }
}

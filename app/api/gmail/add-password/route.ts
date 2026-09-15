import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';
import nodemailer from 'nodemailer';
import { encryptSecret } from '@/lib/crypto';

export async function POST(req: Request) {
    try {
        const userId = await getUserId();
        const { email, name, authMethod, appPassword, smtpHost, smtpPort, dailyLimit } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        if (!authMethod || !['app_password', 'smtp'].includes(authMethod)) {
            return NextResponse.json({ error: 'Invalid auth method. Must be app_password or smtp.' }, { status: 400 });
        }

        if (!appPassword) {
            return NextResponse.json(
                { error: authMethod === 'app_password' ? 'App Password is required' : 'Password is required' },
                { status: 400 }
            );
        }

        // Trim app password (remove spaces — common mistake when copying Google App Passwords)
        const trimmedPassword = appPassword.trim().replace(/\s+/g, '');

        const host = smtpHost || 'smtp.gmail.com';
        const port = Number(smtpPort) || 587;

        // Verify SMTP credentials
        const transport = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: {
                user: email,
                pass: trimmedPassword,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        try {
            await transport.verify();
        } catch (e: any) {
            console.error('SMTP Verification Error:', e);
            const msg = (e.message || '').toLowerCase();
            let errorMessage = 'Authentication failed. Please check your credentials.';

            if (msg.includes('invalid login') || msg.includes('username and password not accepted') || msg.includes('535')) {
                errorMessage = 'Google App Password rejected. Make sure: 1) Gmail 2-Step Verification is enabled, 2) You generated an "App Password" (NOT your regular Gmail password).';
            } else if (msg.includes('connect') || msg.includes('timeout') || msg.includes('econnrefused')) {
                errorMessage = `Cannot connect to SMTP server ${host}:${port}. Verify the host and port.`;
            } else if (msg.includes('certificate') || msg.includes('ssl') || msg.includes('tls')) {
                errorMessage = 'SSL/TLS error. Try port 587 with STARTTLS instead of port 465.';
            } else if (msg.includes('rate limit') || msg.includes('too many')) {
                errorMessage = 'Too many connection attempts. Wait a moment and try again.';
            }

            return NextResponse.json({ error: errorMessage }, { status: 401 });
        }

        const encryptedPass = encryptSecret(trimmedPassword);

        // Upsert Gmail Account via Prisma
        await prisma.gmailAccount.upsert({
            where: {
                userId_email: { userId, email },
            },
            create: {
                userId,
                email,
                name: name || email.split('@')[0],
                authMethod,
                appPasswordEncrypted: encryptedPass,
                smtpHost: host,
                smtpPort: port,
                dailyLimit: Number(dailyLimit) || 20,
                status: 'active',
                isConnected: true,
                workspaceId: 1,
            },
            update: {
                authMethod,
                appPasswordEncrypted: encryptedPass,
                smtpHost: host,
                smtpPort: port,
                dailyLimit: Number(dailyLimit) || 20,
                status: 'active',
                isConnected: true,
                name: name || undefined,
            },
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[Add Password Account Error]:', e);
        return NextResponse.json(
            { error: e.message || 'An internal server error occurred.' },
            { status: 500 }
        );
    }
}

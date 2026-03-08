import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/lib/auth';
import nodemailer from 'nodemailer';

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
        const port = smtpPort || 587;

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

        // Check if account already exists for this user
        const existing = db.prepare(
            'SELECT id FROM gmail_accounts WHERE user_id = ? AND email = ?'
        ).get(userId, email);

        if (existing) {
            // Update existing account credentials
            db.prepare(`
                UPDATE gmail_accounts 
                SET auth_method = ?, app_password = ?, smtp_host = ?, smtp_port = ?, 
                    daily_limit = ?, is_connected = 1, status = 'active',
                    name = COALESCE(NULLIF(?, ''), name)
                WHERE user_id = ? AND email = ?
            `).run(authMethod, trimmedPassword, host, port, dailyLimit || 20, name || '', userId, email);

            return NextResponse.json({ success: true, updated: true });
        }

        // Insert new account (no OAuth fields needed)
        db.prepare(`
            INSERT INTO gmail_accounts (
                user_id, email, name, auth_method, app_password,
                smtp_host, smtp_port, daily_limit, is_connected, status,
                client_id, client_secret
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '')
        `).run(
            userId,
            email,
            name || '',
            authMethod,
            trimmedPassword,
            host,
            port,
            dailyLimit || 20,
            1,
            'active'
        );

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('Add password account error:', e);
        return NextResponse.json(
            { error: e.message || 'Failed to add account' },
            { status: 500 }
        );
    }
}

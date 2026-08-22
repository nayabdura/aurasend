import { NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/verification';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('remote-addr') || 'unknown';
        // Max 30 email verifications per IP per minute for public requests
        const allowed = checkRateLimit(`verifier_${ip}`, 30, 60 * 1000);
        
        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please wait a minute or log in for unlimited verifications.' },
                { status: 429 }
            );
        }

        const body = await req.json();
        const { email } = body;

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Valid email string required' }, { status: 400 });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const result = await verifyEmail(trimmedEmail);

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json(
            { error: 'Verification failed due to an internal server error.' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/verification';

export async function POST(req: Request) {
    const { email } = await req.json();


    if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const result = await verifyEmail(email);
    return NextResponse.json(result);
}

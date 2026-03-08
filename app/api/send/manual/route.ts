
import { processQueue } from '@/lib/gmail';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { count = 1 } = await req.json();

        // Loop count times, but simpler to just call processQueue multiple times or modify processQueue
        // For now, call processQueue in loop
        // Warning: this might be slow if sequential.

        for (let i = 0; i < count; i++) {
            await (processQueue as any)(true, undefined, true);
        }

        return NextResponse.json({ success: true, sent: count });
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

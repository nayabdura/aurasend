import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { pollAllInboxes } from '@/lib/imapMonitor';

export const dynamic = 'force-dynamic';

// POST /api/inbox/poll - manually trigger inbox polling
export async function POST() {
    try {
        const user = await requireAuth();
        const result = await pollAllInboxes(user.id);
        return NextResponse.json({ ...result, success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

import db from '@/lib/db';
import { getTokens, refreshAccessToken } from '@/lib/gmail';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { action } = await req.json();

        // Check if campaign can toggle
        const settings = {
            campaign_status: db.prepare("SELECT value FROM settings WHERE key = 'campaign_status'").get() as { value: string },
        };

        if (action === 'start') {
            // Validate
            const activeGmail = db.prepare("SELECT COUNT(*) as c FROM gmail_accounts WHERE status = 'active'").get() as any;
            const pendingLeads = db.prepare("SELECT COUNT(*) as c FROM leads WHERE status = 'pending'").get() as any;

            if (activeGmail.c === 0) return NextResponse.json({ error: 'No active Gmail accounts' }, { status: 400 });
            if (pendingLeads.c === 0) return NextResponse.json({ error: 'No pending leads' }, { status: 400 });

            db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('campaign_status', 'running')").run();
        } else {
            db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('campaign_status', 'paused')").run();
        }

        return NextResponse.json({ success: true, status: action === 'start' ? 'running' : 'paused' });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const status = (db.prepare("SELECT value FROM settings WHERE key = 'campaign_status'").get() as any)?.value || 'paused';
    return NextResponse.json({ status });
}

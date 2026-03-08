
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: Request) {
    const { campaign_start_at, send_window_start, send_window_end, followup1_delay, followup2_delay } = await req.json();

    if (campaign_start_at !== undefined) db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('campaign_start_at', ?)").run(campaign_start_at);
    if (send_window_start !== undefined) db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('send_window_start', ?)").run(send_window_start);
    if (send_window_end !== undefined) db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('send_window_end', ?)").run(send_window_end);
    if (followup1_delay !== undefined) db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('followup1_delay', ?)").run(followup1_delay);
    if (followup2_delay !== undefined) db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('followup2_delay', ?)").run(followup2_delay);

    return NextResponse.json({ success: true });
}

export async function GET() {
    const params = ['campaign_start_at', 'send_window_start', 'send_window_end', 'followup1_delay', 'followup2_delay'];
    const qs = params.map(p => `'${p}'`).join(',');
    const settings = db.prepare(`SELECT * FROM settings WHERE key IN (${qs})`).all() as any[];

    const res = params.reduce((acc: any, key) => { acc[key] = settings.find((s: any) => s.key === key)?.value || ''; return acc; }, {});
    return NextResponse.json(res);
}

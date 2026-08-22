import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';
import { getAutopilotConfig, updateAutopilotConfig, runAutopilot } from '@/lib/autopilot';

export const dynamic = 'force-dynamic';

// GET /api/autopilot - get config + status
export async function GET() {
    try {
        const user = await requireAuth();
        const config = getAutopilotConfig(user.id);

        // Get recent autopilot actions
        const recentActions = db.prepare(`
            SELECT * FROM system_events 
            WHERE user_id = ? AND type = 'autopilot_action'
            ORDER BY timestamp DESC LIMIT 20
        `).all(user.id) as any[];

        const actions = recentActions.map(a => {
            try { return { ...a, details: JSON.parse(a.details) }; } catch { return a; }
        });

        return NextResponse.json({ config, recentActions: actions });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

// PUT /api/autopilot - update config
export async function PUT(req: Request) {
    try {
        const user = await requireAuth();
        const body = await req.json();

        updateAutopilotConfig(user.id, body);
        const config = getAutopilotConfig(user.id);

        return NextResponse.json({ config, success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

// POST /api/autopilot - run autopilot now
export async function POST() {
    try {
        const user = await requireAuth();
        const report = await runAutopilot(user.id);
        return NextResponse.json({ report, success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

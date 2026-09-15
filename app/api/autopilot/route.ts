import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getAutopilotConfig, updateAutopilotConfig, runAutopilot } from '@/lib/autopilot';

export const dynamic = 'force-dynamic';

// GET /api/autopilot - get config + status
export async function GET() {
    try {
        const user = await requireAuth();
        const config = await getAutopilotConfig(user.id);

        const logs = await prisma.adminAuditLog.findMany({
            where: { adminId: user.id, action: 'AUTOPILOT_ACTION' },
            orderBy: { id: 'desc' },
            take: 20,
        }).catch(() => []);

        const actions = logs.map(a => {
            try { return { ...a, details: a.details ? JSON.parse(a.details) : null }; } catch { return a; }
        });

        return NextResponse.json({ config, recentActions: actions });
    } catch (e: any) {
        console.error('[GET /api/autopilot error]:', e);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

// PUT /api/autopilot - update config
export async function PUT(req: Request) {
    try {
        const user = await requireAuth();
        const body = await req.json();

        const config = await updateAutopilotConfig(user.id, body);

        return NextResponse.json({ config, success: true });
    } catch (e: any) {
        console.error('[PUT /api/autopilot error]:', e);
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
        console.error('[POST /api/autopilot error]:', e);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

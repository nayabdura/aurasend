import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getEffectiveUserId, getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const userId = await getEffectiveUserId();
        const where = userId ? { userId } : {};

        const list = await prisma.template.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        const templates = list.map((t) => ({
            id: t.id,
            user_id: t.userId,
            workspace_id: t.workspaceId || 1,
            name: t.name,
            subject: t.subject,
            body: t.body,
            created_at: t.createdAt,
            updated_at: t.updatedAt,
        }));

        return NextResponse.json(templates);
    } catch (e: any) {
        console.error('[GET Templates Error]:', e);
        return NextResponse.json([]);
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getUserId();
        const { name, subject, body } = await req.json();

        if (!name || !subject || !body) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const created = await prisma.template.create({
            data: {
                userId,
                workspaceId: 1,
                name,
                subject,
                body,
            },
        });

        return NextResponse.json({ success: true, id: created.id });
    } catch (e: any) {
        console.error('[POST Template Error]:', e);
        return NextResponse.json({ error: 'Failed to create template.' }, { status: 500 });
    }
}

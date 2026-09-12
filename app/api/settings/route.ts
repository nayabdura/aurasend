import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const userId = await getUserId().catch(() => null);
        const settings: Record<string, string> = {};

        if (userId) {
            const userSettings = await prisma.userSetting.findMany({
                where: { userId },
            }).catch(() => []);

            userSettings.forEach((row: any) => {
                if (row.value != null) {
                    settings[row.key] = String(row.value);
                }
            });
        }

        return NextResponse.json(settings);
    } catch (e) {
        return NextResponse.json({});
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        if (body && typeof body === 'object') {
            for (const [key, value] of Object.entries(body)) {
                await prisma.userSetting.upsert({
                    where: {
                        userId_key: {
                            userId,
                            key,
                        },
                    },
                    create: {
                        userId,
                        key,
                        value: String(value),
                    },
                    update: {
                        value: String(value),
                    },
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[POST Settings Error]:', err);
        return NextResponse.json({ error: err.message || 'Failed to save settings' }, { status: 500 });
    }
}

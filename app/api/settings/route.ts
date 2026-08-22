import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET() {
    try {
        const userId = await getUserId().catch(() => null); // Optional auth for global settings fallbacks?

        // 1. Get Global Settings
        const globalRows = db.prepare('SELECT * FROM settings').all() as { key: string, value: string }[];
        const settings: any = globalRows.reduce((acc: any, row) => ({ ...acc, [row.key]: row.value }), {});

        // 2. Get User Settings (Override)
        if (userId) {
            const userRows = db.prepare('SELECT key, value FROM user_settings WHERE user_id = ?').all(userId) as { key: string, value: string }[];
            userRows.forEach(row => {
                settings[row.key] = row.value;
            });
        }

        return NextResponse.json(settings);
    } catch (e) {
        return NextResponse.json({}, { status: 200 });
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const update = db.prepare('INSERT OR REPLACE INTO user_settings (user_id, key, value) VALUES (?, ?, ?)');

        // Transaction
        const updateMany = db.transaction((settings: any) => {
            for (const [key, value] of Object.entries(settings)) {
                update.run(userId, key, String(value));
            }
        });

        updateMany(body);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to save settings' }, { status: 500 });
    }
}

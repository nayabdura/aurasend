import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { accountId: string } }) {
    try {
        const userId = await getEffectiveUserId();
        const accountId = parseInt(params.accountId);

        // Security check
        if (userId) {
            const account = db.prepare('SELECT id FROM gmail_accounts WHERE id = ? AND user_id = ?').get(accountId, userId);
            if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const contacts = db.prepare(`
            SELECT id, email, name, status, sent_count, reply_count, created_at
            FROM warmup_contacts
            WHERE gmail_account_id = ?
            ORDER BY id DESC
        `).all(accountId);

        return NextResponse.json(contacts);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: { accountId: string } }) {
    try {
        const userId = await getEffectiveUserId();
        const accountId = parseInt(params.accountId);

        // Security check
        if (userId) {
            const account = db.prepare('SELECT id FROM gmail_accounts WHERE id = ? AND user_id = ?').get(accountId, userId);
            if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const { contacts } = await req.json(); // Expected: [{ email, name }]

        if (!Array.isArray(contacts) || contacts.length === 0) {
            return NextResponse.json({ error: 'Must provide an array of contacts' }, { status: 400 });
        }

        let inserted = 0;
        let skipped = 0;

        const insert = db.prepare(`
            INSERT INTO warmup_contacts (gmail_account_id, email, name, status)
            VALUES (?, ?, ?, 'active')
        `);

        db.transaction(() => {
            for (const c of contacts) {
                if (!c.email) continue;
                try {
                    insert.run(accountId, c.email.trim(), c.name?.trim() || null);
                    inserted++;
                } catch (e: any) {
                    if (e.message.includes('UNIQUE')) {
                        skipped++;
                    } else {
                        throw e;
                    }
                }
            }
        })();

        return NextResponse.json({ success: true, inserted, skipped });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { accountId: string } }) {
    try {
        const userId = await getEffectiveUserId();
        const accountId = parseInt(params.accountId);

        // Security check
        if (userId) {
            const account = db.prepare('SELECT id FROM gmail_accounts WHERE id = ? AND user_id = ?').get(accountId, userId);
            if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const url = new URL(req.url);
        const contactId = url.searchParams.get('id');

        if (contactId) {
            // Delete one
            db.prepare('DELETE FROM warmup_contacts WHERE gmail_account_id = ? AND id = ?').run(accountId, parseInt(contactId));
        } else {
            // Delete all
            db.prepare('DELETE FROM warmup_contacts WHERE gmail_account_id = ?').run(accountId);
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

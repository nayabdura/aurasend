import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getEffectiveUserId } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const userId = await getEffectiveUserId();

    if (!userId) { // Admin might see all? getEffectiveUserId returns null for master? No, returns null if MASTER.
        // If master (userId is null), we should allow it.
        // Wait, getEffectiveUserId returns NULL if master.
    }

    // BUT we need to be careful. If userId is NULL (master), we remove the filter.
    // If not null, we add it.

    let campaign;
    if (userId) {
        campaign = db.prepare("SELECT * FROM campaigns WHERE id = ? AND user_id = ?").get(id, userId);
    } else {
        campaign = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(id);
    }

    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const accounts = db.prepare(`
        SELECT ga.* FROM gmail_accounts ga
        JOIN campaign_accounts ca ON ga.id = ca.gmail_account_id
        WHERE ca.campaign_id = ?
    `).all(id);

    const leads = db.prepare("SELECT * FROM leads WHERE campaign_id = ?").all(id);

    return NextResponse.json({ ...campaign, accounts, leads });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const userId = await getEffectiveUserId();
        const body = await req.json();
        const { account_ids } = body;

        // Security check
        if (userId) {
            const exists = db.prepare("SELECT id FROM campaigns WHERE id = ? AND user_id = ?").get(id, userId);
            if (!exists) return NextResponse.json({ error: 'Unauthorized or Not Found' }, { status: 404 });
        }

        // Update basic info dynamically
        const updates: string[] = [];
        const values: any[] = [];

        const mapping: Record<string, string> = {
            name: 'name',
            status: 'status',
            template_id: 'template_id',
            template_id_b: 'template_id_b',
            send_start: 'send_window_start',
            send_end: 'send_window_end',
            followup1_delay_hours: 'followup1_delay_hours',
            followup2_delay_hours: 'followup2_delay_hours',
            followup1_template_id: 'followup1_template_id',
            followup2_template_id: 'followup2_template_id',
            followup_enabled: 'followup_enabled'
        };

        for (const [key, col] of Object.entries(mapping)) {
            if (body[key] !== undefined) {
                updates.push(`${col} = ?`);
                if (key === 'followup_enabled') {
                    values.push(body[key] ? 1 : 0);
                } else if (body[key] === '' || body[key] === null) {
                    values.push(null);
                } else {
                    values.push(body[key]);
                }
            }
        }

        if (updates.length > 0) {
            const query = `UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`;
            values.push(id);
            db.prepare(query).run(...values);
        }

        // Update accounts if provided
        if (account_ids && Array.isArray(account_ids)) {
            db.prepare("DELETE FROM campaign_accounts WHERE campaign_id = ?").run(id);
            const insert = db.prepare("INSERT INTO campaign_accounts (campaign_id, gmail_account_id) VALUES (?, ?)");
            const insertMany = db.transaction((ids: any[]) => {
                for (const accId of ids) insert.run(id, accId);
            });
            insertMany(account_ids);
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const userId = await getEffectiveUserId();

        let result;
        if (userId) {
            result = db.prepare("DELETE FROM campaigns WHERE id = ? AND user_id = ?").run(id, userId);
        } else {
            result = db.prepare("DELETE FROM campaigns WHERE id = ?").run(id);
        }

        if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        db.prepare("DELETE FROM campaign_accounts WHERE campaign_id = ?").run(id);
        // Optionally update leads?
        db.prepare("UPDATE leads SET campaign_id = NULL WHERE campaign_id = ?").run(id);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

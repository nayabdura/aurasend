import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPlanLimits, isWithinLimit } from '@/lib/plans';
import db from '@/lib/db';

// GET /api/account-leads/[accountId] — get all leads for a specific Gmail account
export async function GET(request: Request, { params }: { params: { accountId: string } }) {
    try {
        const user = await requireAuth();
        const accountId = parseInt(params.accountId);

        // Verify account belongs to user (or master can see any)
        const account = db.prepare(
            `SELECT id FROM gmail_accounts WHERE id = ? AND (user_id = ? OR ? = 'master')`
        ).get(accountId, user.id, user.role) as any;

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        const leads = db.prepare(`
            SELECT * FROM account_leads 
            WHERE gmail_account_id = ? 
            ORDER BY created_at DESC
        `).all(accountId);

        return NextResponse.json({ leads });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/account-leads/[accountId] — add leads to a specific account
export async function POST(request: Request, { params }: { params: { accountId: string } }) {
    try {
        const user = await requireAuth();
        const accountId = parseInt(params.accountId);

        // Check plan limits for per-account leads
        const userRecord = db.prepare('SELECT plan FROM users WHERE id = ?').get(user.id) as any;
        const limits = getPlanLimits(userRecord?.plan);

        if (!limits.canUsePerAccountLeads && user.role !== 'master') {
            return NextResponse.json({
                error: 'Per-account lead sheets require the Unlimited plan. Please upgrade.'
            }, { status: 403 });
        }

        // Verify account belongs to user
        const account = db.prepare(
            `SELECT id FROM gmail_accounts WHERE id = ? AND (user_id = ? OR ? = 'master')`
        ).get(accountId, user.id, user.role) as any;

        if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

        const data = await request.json();
        const { leads } = data; // array of lead objects

        if (!Array.isArray(leads) || leads.length === 0) {
            return NextResponse.json({ error: 'No leads provided' }, { status: 400 });
        }

        // Check total contact limits
        if (limits.maxContacts !== -1) {
            const existingCount = (db.prepare(
                'SELECT COUNT(*) as count FROM account_leads WHERE gmail_account_id = ?'
            ).get(accountId) as any)?.count || 0;

            const totalAfter = existingCount + leads.length;
            if (totalAfter > limits.maxContacts) {
                return NextResponse.json({
                    error: `Adding ${leads.length} leads would exceed your contact limit of ${limits.maxContacts}.`
                }, { status: 403 });
            }
        }

        const insert = db.prepare(`
            INSERT OR IGNORE INTO account_leads 
            (gmail_account_id, user_id, email, first_name, last_name, company, phone, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `);

        const insertMany = db.transaction((items: any[]) => {
            for (const lead of items) {
                insert.run(
                    accountId,
                    user.id,
                    lead.email,
                    lead.first_name || lead.firstName || '',
                    lead.last_name || lead.lastName || '',
                    lead.company || '',
                    lead.phone || '',
                    lead.notes || ''
                );
            }
        });

        insertMany(leads);

        return NextResponse.json({ success: true, count: leads.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/account-leads/[accountId] — removes ALL leads from an account (admin only)
export async function DELETE(request: Request, { params }: { params: { accountId: string } }) {
    try {
        const user = await requireAuth();
        if (user.role !== 'master') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const accountId = parseInt(params.accountId);
        db.prepare('DELETE FROM account_leads WHERE gmail_account_id = ?').run(accountId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

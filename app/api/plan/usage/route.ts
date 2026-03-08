import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPlanLimits, formatLimit, PLAN_NAMES, PlanType } from '@/lib/plans';
import db from '@/lib/db';

export async function GET() {
    try {
        const user = await requireAuth();
        const userRecord = db.prepare('SELECT plan, plan_status, created_at, email FROM users WHERE id = ?').get(user.id) as any;

        const plan = (userRecord?.plan || 'free') as PlanType;
        const limits = getPlanLimits(plan);

        // Get current usage counts
        const gmailCount = (db.prepare('SELECT COUNT(*) as c FROM gmail_accounts WHERE user_id = ?').get(user.id) as any)?.c || 0;
        const contactCount = (db.prepare('SELECT COUNT(*) as c FROM contacts WHERE user_id = ?').get(user.id) as any)?.c || 0;
        const campaignCount = (db.prepare('SELECT COUNT(*) as c FROM campaigns WHERE user_id = ?').get(user.id) as any)?.c || 0;

        // Monthly sent emails (estimate from this month's logs)
        let emailsSentThisMonth = 0;
        try {
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            emailsSentThisMonth = (db.prepare(
                `SELECT COUNT(*) as c FROM email_sends WHERE user_id = ? AND sent_at >= ?`
            ).get(user.id, monthStart.toISOString()) as any)?.c || 0;
        } catch (e) {
            // Table may not exist — ignore
        }

        return NextResponse.json({
            plan,
            planName: PLAN_NAMES[plan],
            planStatus: userRecord?.plan_status || 'active',
            limits: {
                gmailAccounts: { used: gmailCount, max: limits.maxGmailAccounts, formatted: formatLimit(limits.maxGmailAccounts) },
                monthlyEmails: { used: emailsSentThisMonth, max: limits.maxMonthlyEmails, formatted: formatLimit(limits.maxMonthlyEmails) },
                contacts: { used: contactCount, max: limits.maxContacts, formatted: formatLimit(limits.maxContacts) },
                campaigns: { used: campaignCount, max: limits.maxCampaigns, formatted: formatLimit(limits.maxCampaigns) },
            },
            features: {
                canUseAI: limits.canUseAI,
                canUseEnrichment: limits.canUseEnrichment,
                canUseFollowUps: limits.canUseFollowUps,
                canUsePerAccountLeads: limits.canUsePerAccountLeads,
                canUseAnalytics: limits.canUseAnalytics,
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

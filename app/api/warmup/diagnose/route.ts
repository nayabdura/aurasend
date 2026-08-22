import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import db from '@/lib/db';
import { processWarmupQueue } from '@/lib/warmupEngine';

/**
 * GET /api/warmup/diagnose
 * Returns a full diagnostic report for the current user's warmup status.
 */
export async function GET() {
    try {
        const userId = await getUserId();

        // Get all accounts for this user
        const accounts = db.prepare(
            'SELECT * FROM gmail_accounts WHERE user_id = ? ORDER BY id'
        ).all(userId) as any[];

        const today = new Date().toISOString().split('T')[0];
        const currentHour = new Date().getHours();

        const report = accounts.map(account => {
            const warmupDay = account.warmup_day || 1;
            const warmupSentToday = account.warmup_sent_today || 0;
            const warmupLastDate = account.warmup_last_date || null;
            const dailyTarget = Math.min(5 + Math.floor((warmupDay - 1) / 7) * 5, 40);
            const isNewDay = warmupLastDate !== today;

            // Check template
            let templateStatus = 'MISSING';
            let templateName = null;
            if (account.warmup_template_id) {
                const tpl = db.prepare('SELECT name FROM warmup_templates WHERE id = ? AND is_active = 1').get(account.warmup_template_id) as any;
                if (tpl) { templateStatus = 'OK'; templateName = tpl.name; }
                else { templateStatus = 'ASSIGNED_BUT_INACTIVE'; }
            } else {
                // Check global templates
                const globalTpl = db.prepare('SELECT name FROM warmup_templates WHERE user_id = ? AND gmail_account_id IS NULL AND is_active = 1 LIMIT 1').get(userId) as any;
                if (globalTpl) { templateStatus = 'USING_GLOBAL'; templateName = globalTpl.name; }
                else { templateStatus = 'MISSING'; }
            }

            // Check dedicated contacts
            const contactCount = (db.prepare("SELECT COUNT(*) as c FROM warmup_contacts WHERE gmail_account_id = ? AND status = 'active'").get(account.id) as any)?.c || 0;

            // Check peer accounts (fallback)
            const peerCount = (db.prepare("SELECT COUNT(*) as c FROM gmail_accounts WHERE user_id = ? AND id != ? AND is_connected = 1 AND status = 'active'").get(userId, account.id) as any)?.c || 0;

            // Count warmup logs today
            const sentTodayFromLog = (db.prepare("SELECT COUNT(*) as c FROM warmup_logs WHERE gmail_account_id = ? AND DATE(timestamp, 'unixepoch') = DATE('now')").get(account.id) as any)?.c || 0;

            // Last warmup log
            const lastLog = db.prepare("SELECT to_email, subject, datetime(timestamp, 'unixepoch') as sent_at FROM warmup_logs WHERE gmail_account_id = ? ORDER BY timestamp DESC LIMIT 1").get(account.id) as any;

            // Build list of issues
            const issues: string[] = [];
            let canSend = true;

            if (!account.warmup_enabled) { issues.push('❌ Warmup is NOT enabled - click "Enable Warmup" in the Warmup page'); canSend = false; }
            if (!account.is_connected) { issues.push('❌ Account is not connected - reconnect via OAuth or App Password'); canSend = false; }
            if (account.status !== 'active') { issues.push(`❌ Account status is "${account.status}" (must be "active")`); canSend = false; }
            if (templateStatus === 'MISSING') { issues.push('❌ No warmup template assigned and no global templates exist - create one in Warmup → Templates'); canSend = false; }
            if (contactCount === 0 && peerCount === 0) { issues.push('❌ No warmup target emails - add contacts in "Manage Targets" OR connect a second Gmail account'); canSend = false; }
            if (currentHour < 7 || currentHour > 20) { issues.push(`⚠️ Outside sending hours (7am-8pm) - current hour: ${currentHour}:00. Cron runs during 7am–8pm only`); }
            if (!isNewDay && warmupSentToday >= dailyTarget) { issues.push(`⚠️ Daily target already met: ${warmupSentToday}/${dailyTarget} sent today`); }

            if (issues.length === 0) {
                issues.push(`✅ Everything looks good! Next send in ≤15 min (cron runs every 15 min)`);
            }

            return {
                email: account.email,
                name: account.name || null,
                warmup_enabled: !!account.warmup_enabled,
                is_connected: !!account.is_connected,
                status: account.status,
                warmup_day: warmupDay,
                daily_target: dailyTarget,
                sent_today_counter: warmupSentToday,
                sent_today_actual: sentTodayFromLog,
                is_new_day: isNewDay,
                template_status: templateStatus,
                template_name: templateName,
                dedicated_contacts: contactCount,
                peer_accounts: peerCount,
                last_warmup_email: lastLog || null,
                can_send: canSend,
                issues,
            };
        });

        return NextResponse.json({
            current_time: new Date().toISOString(),
            current_hour: currentHour,
            cron_window: '7am - 8pm',
            cron_interval: 'every 15 minutes',
            next_trigger_approx: `within ${15 - (new Date().getMinutes() % 15)} minutes`,
            accounts: report,
        });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

/**
 * POST /api/warmup/diagnose
 * Manually trigger ONE warmup cycle immediately (bypasses the cron timer).
 */
export async function POST() {
    try {
        await getUserId(); // Auth check
        const result = await processWarmupQueue();
        return NextResponse.json({
            success: true,
            message: `Manual warmup trigger complete`,
            processed: result.processed,
            errors: result.errors,
        });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

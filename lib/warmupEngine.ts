import db from './db';
import { log } from './logging';
import { sendEmailViaGmail, GmailAccount } from './gmail';
import { eventBus } from './events';

interface WarmupTemplate {
    id: number;
    name: string;
    subject: string;
    body: string;
    followup1_subject: string | null;
    followup1_body: string | null;
    followup2_subject: string | null;
    followup2_body: string | null;
    rotation_order: number;
}

/**
 * Get the daily warmup volume target for a given warmup day.
 * Ramps gradually: 5 → 10 → 15 → 20 → 25 → 30 → 40
 */
function getDailyTarget(day: number): number {
    return Math.min(5 + Math.floor((day - 1) / 7) * 5, 40);
}

/**
 * Pick the next template in rotation for a given account.
 * Uses round-robin based on rotation_order.
 */
function pickTemplate(accountId: number, userId: number): WarmupTemplate | null {
    // 1. Get the specific template assigned to this account
    const account = db.prepare('SELECT warmup_template_id FROM gmail_accounts WHERE id = ?').get(accountId) as any;
    if (account?.warmup_template_id) {
        const tpl = db.prepare('SELECT * FROM warmup_templates WHERE id = ? AND is_active = 1').get(account.warmup_template_id) as WarmupTemplate | undefined;
        if (tpl) return tpl;
    }

    // 2. Fallback: pick from templates bound to this account
    const accountTemplates = db.prepare(
        'SELECT * FROM warmup_templates WHERE gmail_account_id = ? AND user_id = ? AND is_active = 1 ORDER BY rotation_order ASC'
    ).all(accountId, userId) as WarmupTemplate[];

    if (accountTemplates.length > 0) {
        // Round-robin: count how many sends today, mod by template count
        const sentToday = (db.prepare(
            "SELECT COUNT(*) as c FROM warmup_logs WHERE gmail_account_id = ? AND DATE(timestamp, 'unixepoch') = DATE('now')"
        ).get(accountId) as any)?.c || 0;
        return accountTemplates[sentToday % accountTemplates.length];
    }

    // 3. Final fallback: global templates (gmail_account_id IS NULL)
    const globalTemplates = db.prepare(
        'SELECT * FROM warmup_templates WHERE gmail_account_id IS NULL AND user_id = ? AND is_active = 1 ORDER BY rotation_order ASC'
    ).all(userId) as WarmupTemplate[];

    if (globalTemplates.length > 0) {
        const sentToday = (db.prepare(
            "SELECT COUNT(*) as c FROM warmup_logs WHERE gmail_account_id = ? AND DATE(timestamp, 'unixepoch') = DATE('now')"
        ).get(accountId) as any)?.c || 0;
        return globalTemplates[sentToday % globalTemplates.length];
    }

    return null;
}

/**
 * Personalize template variables
 */
function personalize(text: string, vars: Record<string, string>): string {
    let result = text;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
}

/**
 * Process warmup sends for all enabled accounts.
 * Called by the warmup tick/cron endpoint.
 * Completely separate from cold campaigns.
 */
export async function processWarmupQueue(): Promise<{ processed: number; errors: number }> {
    let processed = 0;
    let errors = 0;

    try {
        // Get all accounts with warmup enabled
        const accounts = db.prepare(`
            SELECT * FROM gmail_accounts 
            WHERE warmup_enabled = 1 AND status = 'active' AND is_connected = 1
        `).all() as GmailAccount[];

        if (accounts.length === 0) {
            log('info', 'Warmup: No accounts with warmup enabled');
            return { processed: 0, errors: 0 };
        }

        const today = new Date().toISOString().split('T')[0];

        for (const account of accounts) {
            try {
                const acctAny = account as any;
                const warmupDay = acctAny.warmup_day || 1;
                const warmupSentToday = acctAny.warmup_sent_today || 0;
                const warmupLastDate = acctAny.warmup_last_date || '';
                const dailyTarget = getDailyTarget(warmupDay);
                const userId = acctAny.user_id;

                // --- Per-account time window check ---
                const now = new Date();
                const currentHHMM = now.getHours() * 60 + now.getMinutes();
                const sendStart = acctAny.warmup_send_start || '07:00';
                const sendEnd = acctAny.warmup_send_end || '20:00';
                const [startH, startM] = sendStart.split(':').map(Number);
                const [endH, endM] = sendEnd.split(':').map(Number);
                const windowStart = startH * 60 + (startM || 0);
                const windowEnd = endH * 60 + (endM || 0);
                if (currentHHMM < windowStart || currentHHMM > windowEnd) {
                    log('info', `Warmup: ${account.email} outside sending window (${sendStart}–${sendEnd}), skipping`);
                    continue;
                }

                // Reset daily counter if new day
                if (warmupLastDate !== today) {
                    db.prepare('UPDATE gmail_accounts SET warmup_sent_today = 0, warmup_last_date = ?, warmup_day = warmup_day + 1 WHERE id = ?')
                        .run(today, account.id);
                }

                // Check if we've hit the daily warmup target
                const currentSent = warmupLastDate === today ? warmupSentToday : 0;
                if (currentSent >= dailyTarget) {
                    continue; // Already hit target for today
                }

                // Pick template
                const template = pickTemplate(account.id, userId);
                if (!template) {
                    log('info', `Warmup: No template found for ${account.email}, skipping`);
                    continue;
                }

                // Fetch dedicated warmup contacts for this account
                const dedicatedContacts = db.prepare(
                    "SELECT email, name FROM warmup_contacts WHERE gmail_account_id = ? AND status = 'active'"
                ).all(account.id) as { email: string, name: string | null }[];

                let targetEmail: string;
                let targetName: string;

                if (dedicatedContacts.length > 0) {
                    // Pick from custom list
                    const targetContact = dedicatedContacts[currentSent % dedicatedContacts.length];
                    targetEmail = targetContact.email;
                    targetName = targetContact.name || targetEmail.split('@')[0];
                } else {
                    // Fallback to internal peer accounts if no dedicated list is provided
                    const otherAccounts = db.prepare(
                        'SELECT email FROM gmail_accounts WHERE user_id = ? AND id != ? AND is_connected = 1 AND status = \'active\' LIMIT 5'
                    ).all(userId, account.id) as { email: string }[];

                    if (otherAccounts.length > 0) {
                        targetEmail = otherAccounts[currentSent % otherAccounts.length].email;
                        targetName = targetEmail.split('@')[0];
                    } else {
                        log('info', `Warmup: ${account.email} has no dedicated warmup contacts and no peer accounts`);
                        continue;
                    }
                }

                const vars = {
                    name: targetName,
                    sender_name: account.email.split('@')[0],
                    company: 'Company',
                    email: targetEmail,
                };

                const subject = personalize(template.subject, vars);
                const body = personalize(template.body, vars);

                // Wrap body in HTML
                const htmlBody = `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">${body.replace(/\n/g, '<br/>')}</div>`;

                // Send the email
                const result = await sendEmailViaGmail(account, targetEmail, subject, htmlBody);

                // Log it separately in warmup_logs
                db.prepare(`
                    INSERT INTO warmup_logs (user_id, gmail_account_id, warmup_template_id, to_email, subject, type, thread_id)
                    VALUES (?, ?, ?, ?, ?, 'warmup_send', ?)
                `).run(userId, account.id, template.id, targetEmail, subject, result?.threadId || null);

                // Increment sent_count if sent to a dedicated contact list
                db.prepare(
                    "UPDATE warmup_contacts SET sent_count = sent_count + 1 WHERE gmail_account_id = ? AND email = ?"
                ).run(account.id, targetEmail);

                // Update warmup counters
                db.prepare('UPDATE gmail_accounts SET warmup_sent_today = warmup_sent_today + 1 WHERE id = ?')
                    .run(account.id);

                // Update health score — use ?? 0 so new accounts truly start at 0, not defaulting to 50
                const currentHealth = acctAny.warmup_health_score ?? 0;
                const newHealth = Math.min(100, currentHealth + 2);
                db.prepare('UPDATE gmail_accounts SET warmup_health_score = ? WHERE id = ?')
                    .run(newHealth, account.id);

                log('info', `Warmup: Sent warmup email from ${account.email} to ${targetEmail} (Day ${warmupDay}, Template: ${template.name})`);
                try { eventBus.emitEvent('WARMUP_SENT', account.user_id, { account: account.email, to: targetEmail, template: template.name }); } catch (e) { }
                processed++;

            } catch (accountErr: any) {
                errors++;
                log('error', `Warmup: Failed for ${account.email}: ${accountErr.message}`);

                // Decrease health on failures — also use ?? 0 to avoid || 50 issue
                const acctAny = account as any;
                const currentHealth = acctAny.warmup_health_score ?? 0;
                const newHealth = Math.max(0, currentHealth - 5);
                db.prepare('UPDATE gmail_accounts SET warmup_health_score = ? WHERE id = ?')
                    .run(newHealth, account.id);
            }
        }

        log('info', `Warmup: Processed ${processed} emails, ${errors} errors`);
    } catch (e: any) {
        log('error', `Warmup queue error: ${e.message}`);
    }

    return { processed, errors };
}

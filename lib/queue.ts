/**
 * Queue Module — Direct In-Process Email Sending
 * - Uses the full renderTemplate function for proper personalization
 * - Handles all variables: {{first_name}}, {{last_name}}, {{company_name}}, {{website}}, spintax
 * - Includes unsubscribe footer + open tracking pixel
 */

import { log } from './logging';

export interface SendJobData {
    leadId: number;
    accountId: number;
    campaignId?: number;
    templateId?: number;
}

// No-op — no worker needed without Redis
export async function initQueueWorker() {
    log('info', '✅ Direct send mode active (no Redis required)');
}

// Send inline — no queue, fires immediately
export async function enqueueSend(data: SendJobData): Promise<void> {
    const db = (await import('./db')).default;
    await runSendJob(db, data.leadId, data.accountId, data.templateId, data.campaignId);
}

async function runSendJob(
    db: any,
    leadId: number,
    accountId: number,
    templateId?: number,
    campaignId?: number,
) {
    const { sendEmailViaGmail, renderTemplate } = await import('./gmail');

    // ── Load account ──────────────────────────────────────────────────────────
    const account = db.prepare('SELECT * FROM gmail_accounts WHERE id = ?').get(accountId);
    if (!account) throw new Error(`Account ${accountId} not found`);
    if (!['active', 'paused'].includes(account.status)) throw new Error(`Account ${account.email} is blocked (status: ${account.status}). Fix it in Gmail Settings.`);
    if (account.sent_today >= account.daily_limit) throw new Error(`Daily limit reached for ${account.email} (${account.sent_today}/${account.daily_limit})`);

    // ── Load lead ─────────────────────────────────────────────────────────────
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
    if (!lead) throw new Error(`Lead ${leadId} not found`);
    if (['bounced', 'unsubscribed', 'replied'].includes(lead.status)) {
        log('info', `Skipping ${lead.email} — status: ${lead.status}`);
        return;
    }

    // ── Blacklist / Suppression check ─────────────────────────────────────────
    const suppressed = db
        .prepare('SELECT id FROM suppressions WHERE (workspace_id = ? OR workspace_id IS NULL) AND domain_or_email = ?')
        .get(lead.workspace_id ?? account.workspace_id ?? 1, lead.email);
    if (suppressed) {
        db.prepare("UPDATE leads SET status = 'unsubscribed' WHERE id = ?").run(lead.id);
        log('info', `Suppressed/Blacklisted: ${lead.email}`);
        return;
    }

    // Also check blacklist table directly
    const blacklisted = db.prepare('SELECT id FROM blacklist WHERE email = ?').get(lead.email);
    if (blacklisted) {
        db.prepare("UPDATE leads SET status = 'unsubscribed' WHERE id = ?").run(lead.id);
        log('info', `Blacklisted: ${lead.email}`);
        return;
    }

    // ── Load template ─────────────────────────────────────────────────────────
    let subject = 'Hello {{first_name}}';
    let body = '<p>Hi {{first_name}},</p><p>I wanted to reach out about {{company_name}}.</p>';

    if (templateId) {
        const tpl = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
        if (tpl && tpl.subject && tpl.body) {
            subject = tpl.subject;
            body = tpl.body;
            log('info', `Using template #${templateId}: "${tpl.name}" — Subject: "${tpl.subject.substring(0, 50)}"`);
        } else {
            log('error', `Template ${templateId} not found or empty — using fallback`);
        }
    } else {
        log('info', `No template ID provided — using generic fallback for lead ${leadId}`);
    }

    // ── Render template with ALL personalization variables ────────────────────
    subject = renderTemplate(subject, lead, account);
    body = renderTemplate(body, lead, account);

    // ── Add signature ─────────────────────────────────────────────────────────
    const signature = account.signature
        ? `<br><br><div style="color:#555;font-size:13px;">${account.signature.replace(/\n/g, '<br>')}</div>`
        : '';

    // ── Add tracking pixel + unsubscribe footer ───────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const pixel = `<img src="${baseUrl}/api/track/open/${lead.id}" width="1" height="1" style="display:none;border:0;outline:none;" alt="">`;
    const footer = `<br><br><div style="font-size:11px;color:#999;border-top:1px solid #eee;padding-top:8px;margin-top:16px;">Don't want these emails? <a href="${baseUrl}/api/unsubscribe/${lead.id}" style="color:#999;">Unsubscribe</a>.</div>`;

    const fullHtml = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#222;">${body}</div>${signature}${footer}${pixel}`;

    // ── Send ──────────────────────────────────────────────────────────────────
    const msg = await sendEmailViaGmail(account, lead.email, subject, fullHtml);
    const now = Date.now();

    db.prepare("UPDATE leads SET status='sent', sent_at=?, last_sent_at=?, thread_id=? WHERE id=?")
        .run(now, now, msg.threadId, lead.id);
    db.prepare("UPDATE gmail_accounts SET sent_today = sent_today + 1 WHERE id=?").run(account.id);
    db.prepare("INSERT INTO email_logs (lead_id, gmail_id, workspace_id, user_id, type, message_id) VALUES (?,?,?,?,'sent',?)")
        .run(lead.id, account.id, account.workspace_id ?? 1, account.user_id, msg.id);

    log('success', `✅ Sent to ${lead.email} via ${account.email} | Subject: "${subject.substring(0, 60)}"`);
}

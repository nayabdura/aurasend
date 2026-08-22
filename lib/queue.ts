/**
 * Queue Module — Direct In-Process Email Sending
 * - Uses the full renderTemplate function for proper personalization
 * - Handles all variables: {{first_name}}, {{last_name}}, {{company_name}}, {{website}}, spintax
 * - Generates live Gemini AI personalized emails on-the-fly for every lead
 */

import 'server-only';
import { log } from './logging';
import db from './db';
import { sendEmailViaGmail, renderTemplate, processHtmlBody } from './gmail';
import { generatePersonalizedEmail } from './gemini';

export interface SendJobData {
    leadId: number;
    accountId: number;
    campaignId?: number;
    templateId?: number;
}

// In-memory queues per account to run email sending asynchronously and concurrently across mailboxes
const accountQueues: Map<number, Promise<void>> = new Map();

/**
 * Enqueue an email sending task for a specific account.
 */
export async function enqueueSend(job: SendJobData): Promise<void> {
    const { accountId } = job;
    const previousQueue = accountQueues.get(accountId) || Promise.resolve();

    const currentJob = previousQueue
        .then(() => processSingleSend(job))
        .catch(err => {
            log('error', `Account #${accountId} send error: ${err.message}`);
        });

    accountQueues.set(accountId, currentJob);
    return currentJob;
}

async function processSingleSend(job: SendJobData) {
    const { leadId, accountId, templateId } = job;

    // ── Load lead ─────────────────────────────────────────────────────────────
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId) as any;
    if (!lead) throw new Error(`Lead ${leadId} not found`);

    // ── Global bounce check ───────────────────────────────────────────────────
    const globalBounce = db.prepare('SELECT id FROM global_suppression WHERE email = ?').get(lead.email) as any;
    if (globalBounce) throw new Error(`Lead ${lead.email} is globally suppressed`);

    // ── Load account ──────────────────────────────────────────────────────────
    const account = db.prepare('SELECT * FROM gmail_accounts WHERE id = ?').get(accountId) as any;
    if (!account) throw new Error(`Account ${accountId} not found`);
    if (!['active', 'paused'].includes(account.status)) throw new Error(`Account ${account.email} is blocked (status: ${account.status}). Fix it in Gmail Settings.`);
    if (account.sent_today >= account.daily_limit) throw new Error(`Daily limit reached for ${account.email} (${account.sent_today}/${account.daily_limit})`);

    if (['bounced', 'unsubscribed', 'replied'].includes(lead.status)) {
        log('info', `Skipping ${lead.email} — status: ${lead.status}`);
        return;
    }

    // ── Blacklist / Suppression check ─────────────────────────────────────────
    const suppressed = db
        .prepare('SELECT id FROM suppressions WHERE (workspace_id = ? OR workspace_id IS NULL) AND domain_or_email = ?')
        .get(lead.workspace_id ?? account.workspace_id ?? 1, lead.email) as any;
    if (suppressed) {
        db.prepare("UPDATE leads SET status = 'unsubscribed' WHERE id = ?").run(lead.id);
        log('info', `Suppressed/Blacklisted: ${lead.email}`);
        return;
    }

    const blacklisted = db.prepare('SELECT id FROM blacklist WHERE email = ?').get(lead.email);
    if (blacklisted) {
        db.prepare("UPDATE leads SET status = 'unsubscribed' WHERE id = ?").run(lead.id);
        log('info', `Blacklisted: ${lead.email}`);
        return;
    }

    // ── Load template or AI Personalized Content ──────────────────────────────
    let subject_raw = '';
    let body_raw = '';

    let aiData: any = null;
    if (lead.notes) {
        try {
            aiData = typeof lead.notes === 'string' ? JSON.parse(lead.notes) : lead.notes;
        } catch (e) {}
    }

    if (aiData && (aiData.subject || aiData.body)) {
        subject_raw = aiData.subject || 'Quick question';
        body_raw = aiData.body || '';
        log('info', `✨ Using pre-generated Gemini AI email for lead #${leadId} (${lead.email})`);
    } else if (process.env.GEMINI_API_KEY) {
        // Generate live Gemini AI personalized email on-the-fly for THIS specific lead!
        log('info', `🤖 Generating live Gemini AI personalized email for lead #${leadId} (${lead.email})...`);
        try {
            const aiRes = await generatePersonalizedEmail(
                lead.user_id || account.user_id || 1,
                lead,
                'Analyze prospect role & company to craft a unique, high-converting outreach email solving their lead gen & sales growth pain points.'
            );
            if (aiRes.success && aiRes.data) {
                subject_raw = aiRes.data.subject;
                body_raw = aiRes.data.body;
                try {
                    db.prepare('UPDATE leads SET notes = ? WHERE id = ?').run(JSON.stringify(aiRes.data), lead.id);
                } catch (e) {}
            }
        } catch (aiErr: any) {
            log('error', `Live Gemini AI Generation failed for lead ${leadId}: ${aiErr.message}`);
        }
    }

    if (!subject_raw && !body_raw && templateId) {
        const tpl = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId) as any;
        if (tpl && tpl.subject && tpl.body) {
            subject_raw = tpl.subject;
            body_raw = tpl.body;
            log('info', `Using template #${templateId}: "${tpl.name}" — Subject: "${tpl.subject.substring(0, 50)}"`);
        }
    }

    if (!subject_raw && !body_raw) {
        subject_raw = `Quick question for {{first_name}}`;
        body_raw = `Hi {{first_name}},\n\nI noticed your work at {{company}} and wanted to reach out regarding our growth solutions.\n\nBest regards,`;
    }

    let subject = subject_raw;
    let body = body_raw;

    // ── Render template with ALL personalization variables ────────────────────
    subject = renderTemplate(subject, lead, account);
    body = renderTemplate(body, lead, account);

    body = processHtmlBody(body);

    const signatureHtml = account.signature ? processHtmlBody(account.signature) : '';
    const signature = signatureHtml
        ? `<div style="margin-top:20px; color:#555; font-size:13px;">${signatureHtml}</div>`
        : '';

    const pixel = '';
    const footer = '';

    const fullHtml = `${body}${signature}${footer}${pixel}`;

    // ── Send ──────────────────────────────────────────────────────────────────
    try {
        const msg = await sendEmailViaGmail(account, lead.email, subject, fullHtml);
        const now = Date.now();

        const updateTransaction = db.transaction(() => {
            db.prepare("UPDATE leads SET status='sent', sent_at=?, last_sent_at=?, thread_id=?, follow_up_count = follow_up_count + 1 WHERE id=?")
                .run(now, now, msg.threadId || msg.id, lead.id);

            db.prepare('UPDATE gmail_accounts SET sent_today = sent_today + 1 WHERE id=?').run(account.id);

            db.prepare(`
                INSERT INTO email_logs 
                (user_id, gmail_account_id, lead_id, campaign_id, recipient_email, subject, body, status, sent_at, thread_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?)
            `).run(
                account.user_id || 1,
                account.id,
                lead.id,
                job.campaignId || null,
                lead.email,
                subject,
                fullHtml,
                now,
                msg.threadId || msg.id
            );
        });

        updateTransaction();
        log('info', `✅ Successfully sent email to ${lead.email} via ${account.email}`);
    } catch (err: any) {
        log('error', `Failed to send to ${lead.email} via ${account.email}: ${err.message}`);

        db.prepare("UPDATE leads SET status='bounced' WHERE id=?").run(lead.id);

        db.prepare(`
            INSERT INTO email_logs 
            (user_id, gmail_account_id, lead_id, campaign_id, recipient_email, subject, body, status, sent_at, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'bounced', ?, ?)
        `).run(
            account.user_id || 1,
            account.id,
            lead.id,
            job.campaignId || null,
            lead.email,
            subject,
            fullHtml,
            Date.now(),
            err.message
        );

        throw err;
    }
}

export async function initQueueWorker(): Promise<void> {
    log('info', 'Queue worker initialized');
}


/**
 * Queue Module — Direct In-Process Email Sending via Prisma Client (Neon PostgreSQL Ready)
 */

import 'server-only';
import { log } from './logging';
import prisma from './prisma';
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
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error(`Lead ${leadId} not found`);

    // ── Global bounce check ───────────────────────────────────────────────────
    const globalBounce = await prisma.globalSuppression.findFirst({
        where: { email: { equals: lead.email, mode: 'insensitive' } },
        select: { id: true },
    });
    if (globalBounce) throw new Error(`Lead ${lead.email} is globally suppressed`);

    // ── Load account ──────────────────────────────────────────────────────────
    const account = await prisma.gmailAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error(`Account ${accountId} not found`);
    if (!['active', 'paused'].includes(account.status)) throw new Error(`Account ${account.email} is blocked (status: ${account.status}). Fix it in Gmail Settings.`);
    if (account.sentToday >= account.dailyLimit) throw new Error(`Daily limit reached for ${account.email} (${account.sentToday}/${account.dailyLimit})`);

    if (['bounced', 'unsubscribed', 'replied'].includes(lead.status)) {
        log('info', `Skipping ${lead.email} — status: ${lead.status}`);
        return;
    }

    // ── Blacklist / Suppression check ─────────────────────────────────────────
    const suppressed = await prisma.globalSuppression.findFirst({
        where: { email: { equals: lead.email, mode: 'insensitive' } },
        select: { id: true },
    });
    if (suppressed) {
        await prisma.lead.update({
            where: { id: lead.id },
            data: { status: 'unsubscribed' },
        });
        log('info', `Suppressed/Blacklisted: ${lead.email}`);
        return;
    }

    // ── Format lead object for template rendering ──────────────────────────────
    const leadObj = {
        id: lead.id,
        user_id: lead.userId,
        workspace_id: lead.workspaceId || 1,
        email: lead.email,
        name: lead.name,
        first_name: lead.firstName || (lead.name ? lead.name.split(' ')[0] : lead.email.split('@')[0]),
        last_name: lead.lastName || (lead.name ? lead.name.split(' ').slice(1).join(' ') : ''),
        company: lead.company,
        company_name: lead.company,
        website: lead.website,
        intro: lead.intro,
        status: lead.status,
    };

    // ── Format account object for email transport ─────────────────────────────
    const accountObj = {
        id: account.id,
        user_id: account.userId,
        workspace_id: account.workspaceId || 1,
        email: account.email,
        name: account.name || account.email.split('@')[0],
        auth_method: account.authMethod,
        client_id: account.clientId,
        client_secret: account.clientSecret,
        access_token_encrypted: account.accessTokenEncrypted,
        refresh_token_encrypted: account.refreshTokenEncrypted,
        app_password_encrypted: account.appPasswordEncrypted,
        smtp_host: account.smtpHost,
        smtp_port: account.smtpPort,
        signature: account.signature,
        sent_today: account.sentToday,
        daily_limit: account.dailyLimit,
        status: account.status,
        is_connected: account.isConnected ? 1 : 0,
    };

    // ── Load template or AI Personalized Content ──────────────────────────────
    let subject_raw = '';
    let body_raw = '';

    if (lead.intro) {
        body_raw = lead.intro;
        subject_raw = `Quick question for ${leadObj.first_name}`;
        log('info', `✨ Using pre-generated AI intro for lead #${leadId} (${lead.email})`);
    } else if (process.env.GEMINI_API_KEY) {
        log('info', `🤖 Generating live Gemini AI personalized email for lead #${leadId} (${lead.email})...`);
        try {
            const aiRes = await generatePersonalizedEmail(
                lead.userId || account.userId || 1,
                leadObj,
                'Analyze prospect role & company to craft a unique, high-converting outreach email.'
            );
            if (aiRes.success && aiRes.data) {
                subject_raw = aiRes.data.subject;
                body_raw = aiRes.data.body;
                try {
                    await prisma.lead.update({
                        where: { id: lead.id },
                        data: { intro: aiRes.data.body },
                    });
                } catch (e) {}
            }
        } catch (aiErr: any) {
            log('error', `Live Gemini AI Generation failed for lead ${leadId}: ${aiErr.message}`);
        }
    }

    if (!subject_raw && !body_raw && templateId) {
        const tpl = await prisma.template.findUnique({ where: { id: templateId } });
        if (tpl && tpl.subject && tpl.body) {
            subject_raw = tpl.subject;
            body_raw = tpl.body;
            log('info', `Using template #${templateId}: "${tpl.name}"`);
        }
    }

    if (!subject_raw && !body_raw) {
        subject_raw = `Quick question for {{first_name}}`;
        body_raw = `Hi {{first_name}},\n\nI noticed your work at {{company}} and wanted to reach out regarding our growth solutions.\n\nBest regards,`;
    }

    let subject = subject_raw;
    let body = body_raw;

    // ── Render template with ALL personalization variables ────────────────────
    subject = renderTemplate(subject, leadObj, accountObj);
    body = renderTemplate(body, leadObj, accountObj);

    body = processHtmlBody(body);

    const signatureHtml = account.signature ? processHtmlBody(account.signature) : '';
    const signature = signatureHtml
        ? `<div style="margin-top:20px; color:#555; font-size:13px;">${signatureHtml}</div>`
        : '';

    const fullHtml = `${body}${signature}`;

    // ── Send ──────────────────────────────────────────────────────────────────
    try {
        const msg = await sendEmailViaGmail(accountObj, lead.email, subject, fullHtml);
        const now = Date.now();

        await prisma.$transaction([
            prisma.lead.update({
                where: { id: lead.id },
                data: {
                    status: 'sent',
                    sentAt: BigInt(now),
                    lastSentAt: BigInt(now),
                    threadId: msg.threadId || msg.id,
                    followUpCount: { increment: 1 },
                },
            }),
            prisma.gmailAccount.update({
                where: { id: account.id },
                data: { sentToday: { increment: 1 } },
            }),
            prisma.emailLog.create({
                data: {
                    userId: account.userId || 1,
                    workspaceId: account.workspaceId || 1,
                    gmailId: account.id,
                    leadId: lead.id,
                    type: 'sent',
                    timestamp: BigInt(now),
                    messageId: msg.threadId || msg.id,
                },
            }),
        ]);

        log('info', `✅ Successfully sent email to ${lead.email} via ${account.email}`);
    } catch (err: any) {
        log('error', `Failed to send to ${lead.email} via ${account.email}: ${err.message}`);

        await prisma.$transaction([
            prisma.lead.update({
                where: { id: lead.id },
                data: { status: 'bounced' },
            }),
            prisma.emailLog.create({
                data: {
                    userId: account.userId || 1,
                    workspaceId: account.workspaceId || 1,
                    gmailId: account.id,
                    leadId: lead.id,
                    type: 'bounced',
                    timestamp: BigInt(Date.now()),
                    messageId: err.message,
                },
            }),
        ]).catch(() => {});

        throw err;
    }
}

export async function initQueueWorker(): Promise<void> {
    log('info', 'Queue worker initialized');
}


import db from './db';
import { log } from './logging';
import { verifyEmail } from './verification';
import { eventBus } from './events';
import { enqueueSend } from './queue';

// ─── Template Renderer ───────────────────────────────────────────────────────
export function renderTemplate(text: string, lead: any, account: any, introLine: string = ''): string {
    if (!text) return '';

    const firstName = lead.name ? lead.name.split(' ')[0] : '';
    const lastName = lead.name && lead.name.includes(' ') ? lead.name.split(' ').slice(1).join(' ') : '';
    const safeAccountName = account.name || account.email.split('@')[0];

    // 1. Process standard variables
    let rendered = text
        .replace(/{{first_name}}/gi, firstName || 'there')
        .replace(/{{last_name}}/gi, lastName)
        .replace(/{{name}}/gi, lead.name || 'there')
        .replace(/{{company_name}}/gi, lead.company || 'your company')
        .replace(/{{company}}/gi, lead.company || 'your company')
        .replace(/{{industry}}/gi, lead.industry || 'your industry')
        .replace(/{{personalized_point}}/gi, introLine || 'the great work you are doing')
        .replace(/{{intro}}/gi, introLine || 'the great work you are doing')
        .replace(/{{your_name}}/gi, safeAccountName)
        .replace(/{{website}}/gi, lead.website || '')
        .replace(/{{email}}/gi, lead.email || '')
        .replace(/{{current_role}}/gi, lead.current_role || 'your role')
        .replace(/{{role}}/gi, lead.current_role || 'your role');

    // 2. Process Spintax (e.g., {Hi|Hello|Hey})
    // Uses a regex to find curly braces without nested curly braces
    const spintaxRegex = /{([^{}]+)}/g;
    let match;
    while ((match = spintaxRegex.exec(rendered)) !== null) {
        const options = match[1].split('|');
        if (options.length > 1) { // Only process if it actually contains a pipe (to avoid catching normal {brackets})
            const randomPick = options[Math.floor(Math.random() * options.length)];
            rendered = rendered.substring(0, match.index) + randomPick + rendered.substring(match.index + match[0].length);
            spintaxRegex.lastIndex = 0; // Reset regex state after string mutation
        }
    }

    return rendered;
}

// Interfaces
export interface GmailAccount {
    id: number;
    user_id: number;
    workspace_id: number;
    email: string;
    client_id: string;
    client_secret: string;
    access_token: string;
    refresh_token: string;
    expiry_date: number;
    daily_limit: number;
    sent_today: number;
    last_sent_date: string;
    status: string;
    is_connected: number;
    warmup_enabled: number;
    warmup_day: number;
    signature?: string;
    auth_method: string;
    app_password?: string;
    smtp_host?: string;
    smtp_port?: number;
    last_daily_reset_at?: number;
}

export interface Lead {
    id: number;
    user_id?: number;
    workspace_id: number;
    name: string;
    email: string;
    website: string;
    company: string;
    current_role?: string;
    intro: string;
    status: string;
    opened: number;
    replied: number;
    thread_id: string;
    last_sent_at: number;
    lead_type: string;
    is_valid: number;
    sent_at: number;
    opened_at: number;
    replied_at: number;
    followup1_sent_at: number;
    followup2_sent_at: number;
    next_followup_at: number;
    follow_up_count: number;
    campaign_id?: number;
}

interface Template {
    id: number;
    name: string;
    subject: string;
    body: string;
}

// OAuth Helpers
export async function getAuthUrl(clientId: string, redirectUri: string) {
    const scopes = [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify'
    ].join(' ');

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes,
        access_type: 'offline',
        prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function getTokens(code: string, clientId: string, clientSecret: string, redirectUri: string) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
        })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error_description || data.error);
    return data;
}

export async function refreshAccessToken(account: GmailAccount): Promise<string> {
    if (Date.now() < account.expiry_date - 300000) {
        return account.access_token;
    }

    log('info', `Refreshing token for ${account.email}...`);

    try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: account.client_id,
                client_secret: account.client_secret,
                refresh_token: account.refresh_token,
                grant_type: 'refresh_token'
            })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error_description || JSON.stringify(data));

        const newAccessToken = data.access_token;
        const expiresIn = data.expires_in;
        const newExpiry = Date.now() + (expiresIn * 1000);

        db.prepare('UPDATE gmail_accounts SET access_token = ?, expiry_date = ? WHERE id = ?')
            .run(newAccessToken, newExpiry, account.id);

        return newAccessToken;
    } catch (error: any) {
        log('error', `Failed to refresh token: ${error.message}`);
        db.prepare("UPDATE gmail_accounts SET status = 'auth_error' WHERE id = ?").run(account.id);
        throw error;
    }
}

// Email Helper
function createMimeMessage(to: string, from: string, subject: string, bodyHtml: string, threadId?: string) {
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    let messageParts = [
        `To: ${to}`,
        `From: ${from}`,
        `Subject: ${utf8Subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        bodyHtml
    ];

    const message = messageParts.join('\n');
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

import nodemailer from 'nodemailer';

export async function sendEmailViaGmail(account: GmailAccount, to: string, subject: string, html: string, threadId?: string) {
    if (account.auth_method === 'app_password' || account.auth_method === 'smtp') {
        const transporter = nodemailer.createTransport({
            host: account.smtp_host || 'smtp.gmail.com',
            port: account.smtp_port || 587,
            secure: account.smtp_port === 465,
            auth: {
                user: account.email,
                pass: (account.app_password || '').trim(),
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        const headers: any = {};
        if (threadId) {
            headers['In-Reply-To'] = threadId;
            headers['References'] = threadId;
        }

        const info = await transporter.sendMail({
            from: account.email,
            to,
            subject,
            html,
            headers,
        });

        return { id: info.messageId, threadId: threadId || info.messageId };
    }

    // Default OAuth
    const accessToken = await refreshAccessToken(account);
    const rawMessage = createMimeMessage(to, account.email, subject, html, threadId);

    const body: any = { raw: rawMessage };
    if (threadId) body.threadId = threadId;

    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data));
    return data;
}

// === V3 Process Queue (Multi-Campaign & Account Rotation) ===

export async function processQueue(ignoreStatus = false, testEmail?: string, userId?: number | null, ignoreWindow = false) {
    // 0. Test Email Bypass & Verification Update
    if (testEmail) {
        log('info', `Sending TEST email to ${testEmail}`);

        // 1. Check if email exists in leads
        const existingLead = db.prepare("SELECT * FROM leads WHERE email = ?").get(testEmail) as Lead | undefined;

        // 2. Proactive Verify
        const verification = await verifyEmail(testEmail);
        if (!verification.isValid) {
            if (existingLead) {
                db.prepare("UPDATE leads SET status = 'invalid', is_valid = 0 WHERE id = ?").run(existingLead.id);
            }
            throw new Error(`Verification Failed: ${verification.reason}`);
        } else {
            if (existingLead) {
                db.prepare("UPDATE leads SET is_valid = 1 WHERE id = ?").run(existingLead.id);
            }
        }

        let account;
        if (userId) {
            account = db.prepare("SELECT * FROM gmail_accounts WHERE status = 'active' AND is_connected = 1 AND user_id = ? LIMIT 1").get(userId) as GmailAccount;
        } else {
            account = db.prepare("SELECT * FROM gmail_accounts WHERE status = 'active' AND is_connected = 1 LIMIT 1").get() as GmailAccount;
        }
        if (!account) throw new Error("No connected Gmail account found for this user");

        try {
            const result = await sendEmailViaGmail(account, testEmail, "Test Email", "<h1>It Works!</h1>");
            log('success', 'Test email sent', result);
            return result;
        } catch (e: any) {
            // If sending fails (bounce), mark invalid
            if (existingLead && (e.message.includes('not found') || e.message.includes('blocked'))) {
                db.prepare("UPDATE leads SET status = 'bounced', is_valid = 0 WHERE id = ?").run(existingLead.id);
            }
            throw e;
        }
    }

    // 1. Process Active Campaigns (Only fetch running ones, even for manual trigger we temporarily set it to running)
    let campaigns: any[] = db.prepare("SELECT * FROM campaigns WHERE status = 'running'").all();

    if (campaigns.length === 0) {
        console.log('No active campaigns.');
        return;
    }

    for (const camp of campaigns) {
        try {
            await processCampaign(camp, ignoreWindow);
        } catch (e) {
            console.error(`Error processing campaign ${camp.name}:`, e);
        }
    }
}

async function processCampaign(campaign: any, ignoreWindow: boolean) {
    // 2. Check Window (Campaign specific if set, otherwise global)
    const globalStart = (db.prepare("SELECT value FROM settings WHERE key = 'send_window_start'").get() as any)?.value || '09:00';
    const globalEnd = (db.prepare("SELECT value FROM settings WHERE key = 'send_window_end'").get() as any)?.value || '17:00';

    const startWindow = campaign.send_window_start || globalStart;
    const endWindow = campaign.send_window_end || globalEnd;
    const now = new Date();
    const currentHour = now.getHours();
    const startHour = parseInt(startWindow.split(':')[0]);
    const endHour = parseInt(endWindow.split(':')[0]);

    if (!ignoreWindow) {
        if (currentHour < startHour || currentHour >= endHour) {
            // console.log(`Outside send window.`); // Too noisy
            return;
        }
    }

    // 3. Get Eligible Accounts
    let accounts: GmailAccount[] = [];
    if (campaign.id) {
        // Specific campaign: check assigned accounts
        accounts = db.prepare(`
            SELECT ga.* FROM gmail_accounts ga 
            JOIN campaign_accounts ca ON ga.id = ca.gmail_account_id 
            WHERE ca.campaign_id = ? AND ga.status = 'active' AND ga.is_connected = 1
        `).all(campaign.id) as GmailAccount[];

        if (accounts.length === 0) {
            console.log(`No accounts assigned or active for campaign ${campaign.name}, skipping.`);
            return;
        }
    } else {
        // Legacy global campaign uses all accounts
        accounts = db.prepare("SELECT * FROM gmail_accounts WHERE status = 'active' AND is_connected = 1").all() as GmailAccount[];
    }

    // Filter by daily limit
    const validAccounts = accounts.filter(a => a.sent_today < a.daily_limit);
    if (validAccounts.length === 0) return; // No capacity

    // Sort by last_sent_date to rotate (Load Balancing) - optional if we use all
    // validAccounts.sort((a, b) => {
    //     const da = a.last_sent_date ? new Date(a.last_sent_date).getTime() : 0;
    //     const db = b.last_sent_date ? new Date(b.last_sent_date).getTime() : 0;
    //     return da - db; // Oldest first
    // });

    // Iterate through ALL valid accounts to maximize throughput
    // Each account will try to pick up a task (Follow-up or New Lead)
    // The DB lock prevents double-sending.

    // 4. Get Template(s) (Once per campaign)
    let template: Template | null = null;
    let templateB: Template | null = null;
    if (campaign.template_id) {
        template = db.prepare("SELECT * FROM templates WHERE id = ?").get(campaign.template_id) as Template;
    }
    if (campaign.template_id_b) {
        templateB = db.prepare("SELECT * FROM templates WHERE id = ?").get(campaign.template_id_b) as Template;
    }

    // Loop through accounts
    for (const account of validAccounts) {
        // A. Prioritize Follow-ups for this account
        if (await checkAndSendFollowUp(account, campaign.id)) {
            continue; // Account busy with follow-up, move to next account
        }

        // B. New Lead
        const campaignFilter = campaign.id ? "AND campaign_id = ?" : "AND campaign_id IS NULL";
        const args = campaign.id ? [campaign.id] : [];

        // Find a pending lead
        const lead = db.prepare(`SELECT * FROM leads WHERE status = 'pending' AND is_valid = 1 ${campaignFilter} LIMIT 1`).get(...args) as Lead | undefined;

        if (lead) {
            // Atomic Lock to avoid double scheduling
            const lock = db.prepare("UPDATE leads SET status = 'processing_queue' WHERE id = ? AND status = 'pending'").run(lead.id);
            if (lock.changes > 0) {
                const chosenTemplateId = (templateB && Math.random() > 0.5) ? templateB.id : template?.id;
                console.log(`[Queue: ${campaign.name}] Enqueueing ${lead.email} via ${account.email} (Template ID: ${chosenTemplateId})`);
                await enqueueSend({
                    leadId: lead.id,
                    accountId: account.id,
                    campaignId: campaign.id,
                    templateId: chosenTemplateId
                });
            }
        }
    }
}

async function checkAndSendFollowUp(account: GmailAccount, campaignId: number | null): Promise<boolean> {
    // Get per-campaign follow-up settings, fall back to global settings
    let followup1Delay = 48; // hours
    let followup2Delay = 96; // hours
    let followupEnabled = true;

    if (campaignId) {
        const camp = db.prepare("SELECT followup1_delay_hours, followup2_delay_hours, followup_enabled FROM campaigns WHERE id = ?").get(campaignId) as any;
        if (camp) {
            followup1Delay = camp.followup1_delay_hours || 48;
            followup2Delay = camp.followup2_delay_hours || 96;
            followupEnabled = camp.followup_enabled !== 0;
        }
    } else {
        followup1Delay = parseInt((db.prepare("SELECT value FROM settings WHERE key = 'followup1_delay'").get() as any)?.value || '48');
        followup2Delay = parseInt((db.prepare("SELECT value FROM settings WHERE key = 'followup2_delay'").get() as any)?.value || '96');
    }

    if (!followupEnabled) return false;

    const nowTime = Date.now();
    const campaignFilter = campaignId ? "AND campaign_id = ?" : "AND campaign_id IS NULL";
    const args = campaignId ? [campaignId] : [];

    // We restrict follow-ups to leads that this account originally emailed (via email_logs or check thread owner? 
    // Simpler: Just check likely candidates and assume if thread_id exists we *try* to use it.
    // BUT correctly, we should limit to leads where we know this account is the owner.
    // Let's rely on finding a lead assigned to this campaign generally, but for threading, using the same account is best.

    // Query leads that sent_at is old enough
    const validF1 = db.prepare(`
        SELECT l.* FROM leads l
        WHERE l.status = 'sent' AND l.replied = 0 AND l.follow_up_count = 0 
        AND l.sent_at < ?
        ${campaignFilter}
        LIMIT 50
    `).all(nowTime - (followup1Delay * 3600000), ...args) as Lead[];

    for (const f1 of validF1) {
        // Init check: did THIS account send it?
        const log = db.prepare("SELECT id FROM email_logs WHERE lead_id = ? AND gmail_id = ? AND type='sent'").get(f1.id, account.id);

        if (log) {
            // Yes, this account sent the original. Lock and send.
            const lock = db.prepare("UPDATE leads SET status = 'processing_f1' WHERE id = ? AND status = 'sent'").run(f1.id);
            if (lock.changes > 0) {
                await sendFollowUp(account, f1, 1);
                return true;
            }
        }
    }

    // Follow-up 2
    const validF2 = db.prepare(`
        SELECT l.* FROM leads l
        WHERE l.status = 'sent' AND l.replied = 0 AND l.follow_up_count = 1
        AND l.followup1_sent_at < ?
        ${campaignFilter}
        LIMIT 50
    `).all(nowTime - (followup2Delay * 3600000), ...args) as Lead[];

    for (const f2 of validF2) {
        const log = db.prepare("SELECT id FROM email_logs WHERE lead_id = ? AND gmail_id = ? AND type='sent'").get(f2.id, account.id);
        if (log) {
            const lock = db.prepare("UPDATE leads SET status = 'processing_f2' WHERE id = ? AND status = 'sent'").run(f2.id);
            if (lock.changes > 0) {
                await sendFollowUp(account, f2, 2);
                return true;
            }
        }
    }

    return false;
}

async function sendNewEmail(account: GmailAccount, lead: Lead, template: Template | null) {
    try {
        // 0. Verify Email (Proactive)
        const verification = await verifyEmail(lead.email);
        if (!verification.isValid) {
            db.prepare("UPDATE leads SET status = 'invalid', is_valid = 0 WHERE id = ?").run(lead.id);
            log('error', `Skipping invalid email ${lead.email}: ${verification.reason}`);
            return;
        }

        // Determine Introduction
        const type = lead.lead_type || 'client';
        const intros = db.prepare("SELECT content FROM training_blocks WHERE type = ?").all(type === 'agency' ? 'agency_intro' : 'client_intro') as { content: string }[];
        let introLine = intros.length > 0 ? intros[Math.floor(Math.random() * intros.length)].content : (lead.intro || "I noticed your work.");

        // Template Selection
        let subject = "Hello {{name}}";
        let body = "Hi {{name}}";

        if (template) {
            subject = template.subject;
            body = template.body;
        } else {
            // Legacy global settings
            const s = db.prepare("SELECT value FROM settings WHERE key = 'template_subject_1'").get() as { value: string };
            const b = db.prepare("SELECT value FROM settings WHERE key = 'template_body_1'").get() as { value: string };
            if (s) subject = s.value;
            if (b) body = b.value;
        }

        subject = renderTemplate(subject, lead, account, introLine);
        body = renderTemplate(body, lead, account, introLine);

        const signature = account.signature ? `<br><br>${account.signature.replace(/\n/g, '<br>')}` : '';
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
        const trackingHtml = `<img src="${baseUrl}/api/track/open/${lead.id}" width="1" height="1" style="display:none;" />`;
        const fullBody = `<div>${body}</div>${signature}${trackingHtml}`;

        const result = await sendEmailViaGmail(account, lead.email, subject, fullBody);
        const now = Date.now();

        // Check labels
        const labelLog = result.labelIds ? `Labels: ${JSON.stringify(result.labelIds)}` : 'No labels';

        db.prepare("UPDATE leads SET status = 'sent', sent_at = ?, last_sent_at = ?, thread_id = ? WHERE id = ?")
            .run(now, now, result.threadId, lead.id);

        db.prepare("UPDATE gmail_accounts SET sent_today = sent_today + 1, last_sent_date = ? WHERE id = ?")
            .run(new Date().toISOString(), account.id);

        db.prepare("INSERT INTO email_logs (lead_id, gmail_id, type, message_id) VALUES (?, ?, 'sent', ?)")
            .run(lead.id, account.id, result.id);

        log('success', `Sent new email to ${lead.email}`, { gmail: account.email, info: labelLog });
        try { eventBus.emitEvent('EMAIL_SENT', account.user_id, { email: lead.email, account: account.email, campaignId: lead.campaign_id }); } catch (e) { }

    } catch (err: any) {
        log('error', `Error sending to ${lead.email}`, err.message);
        const msg = (err.message || '').toLowerCase();

        if (msg.includes('insufficient') || msg.includes('limit') || msg.includes('quota')) {
            db.prepare("UPDATE gmail_accounts SET status = 'quota_limit' WHERE id = ?").run(account.id);
        }
        else if (msg.includes('not found') || msg.includes('does not exist') || msg.includes('blocked') || msg.includes('rejected')) {
            db.prepare("UPDATE leads SET status = 'bounced', is_valid = 0 WHERE id = ?").run(lead.id);
            try { eventBus.emitEvent('BOUNCE_DETECTED', account.user_id, { email: lead.email, account: account.email }); } catch (e) { }
        } else {
            // Reset status
            db.prepare("UPDATE leads SET status = 'pending' WHERE id = ?").run(lead.id);
        }
    }
}

export async function sendFollowUp(account: GmailAccount, lead: Lead, number: number) {
    try {
        log('info', `Sending Follow-up ${number} to ${lead.email}`, { account: account.email });

        let body = "Just checking in...";
        // For now, follow-up templates are still global in settings. 
        // Future: Add follow-up logic to Campaigns table (followup_template_id).
        let templateKey = lead.opened ? 'template_followup_opened' : 'template_followup_unread';
        const rowBody = db.prepare("SELECT value FROM settings WHERE key = ?").get(templateKey) as { value: string };
        if (rowBody) body = rowBody.value;

        body = renderTemplate(body, lead, account);

        const signature = account.signature ? `<br><br>${account.signature.replace(/\n/g, '<br>')}` : '';
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
        const trackingHtml = `<img src="${baseUrl}/api/track/open/${lead.id}" width="1" height="1" style="display:none;" />`;
        const fullBody = `<div>${body}</div>${signature}${trackingHtml}`;

        const result = await sendEmailViaGmail(account, lead.email, "Re: Follow Up", fullBody, lead.thread_id);
        const now = Date.now();

        let updateSql = "UPDATE leads SET follow_up_count = ?, last_sent_at = ?, status = 'sent' WHERE id = ?";
        if (number === 1) updateSql = "UPDATE leads SET follow_up_count = ?, last_sent_at = ?, followup1_sent_at = ?, status = 'sent' WHERE id = ?";
        else updateSql = "UPDATE leads SET follow_up_count = ?, last_sent_at = ?, followup2_sent_at = ?, status = 'sent' WHERE id = ?";

        if (number === 1) db.prepare(updateSql).run(1, now, now, lead.id);
        else db.prepare(updateSql).run(2, now, now, lead.id);

        db.prepare("UPDATE gmail_accounts SET sent_today = sent_today + 1 WHERE id = ?").run(account.id);

        db.prepare("INSERT INTO email_logs (lead_id, gmail_id, type, message_id) VALUES (?, ?, 'followup', ?)")
            .run(lead.id, account.id, result.id);

        log('success', `Sent follow-up ${number} to ${lead.email}`, { account: account.email });
        try { eventBus.emitEvent('FOLLOWUP_SENT', account.user_id, { email: lead.email, account: account.email, followupNumber: number }); } catch (e) { }

    } catch (err: any) {
        log('error', `Error sending follow-up to ${lead.email}: ${err.message}`, { account: account.email });
        const msg = (err.message || '').toLowerCase();

        if (msg.includes('not found') || msg.includes('does not exist') || msg.includes('blocked')) {
            db.prepare("UPDATE leads SET status = 'bounced', is_valid = 0 WHERE id = ?").run(lead.id);
        } else {
            // Reset
            db.prepare("UPDATE leads SET status = 'sent' WHERE id = ?").run(lead.id);
        }
    }
}

// Check Replies
export async function checkReplies() {
    log('info', 'Checking for replies and unsubscribe requests...');

    const accounts: GmailAccount[] = db.prepare("SELECT * FROM gmail_accounts WHERE is_connected = 1").all() as GmailAccount[];

    for (const account of accounts) {
        try {
            if (account.auth_method === 'app_password' || account.auth_method === 'smtp') {
                log('info', `Skipping reply check for SMTP/App Password account ${account.email} (IMAP not implemented)`);
                continue;
            }

            // Get valid access token
            const accessToken = await refreshAccessToken(account);

            // Get leads that have been sent emails but not yet replied
            const leads: Lead[] = db.prepare(`
                SELECT * FROM leads 
                WHERE status = 'sent' 
                AND replied = 0 
                AND thread_id IS NOT NULL
            `).all() as Lead[];

            for (const lead of leads) {
                try {
                    // Fetch thread details
                    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${lead.thread_id}`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });

                    if (!res.ok) {
                        if (res.status === 404) continue; // Thread deleted or not found
                        throw new Error(`Gmail API Error: ${res.status} ${res.statusText}`);
                    }

                    const threadData = await res.json();
                    const messages = threadData.messages || [];

                    // Check if there are messages
                    if (messages.length > 0) {
                        // Get the latest message
                        const latestMessage = messages[messages.length - 1];

                        // Need to fetch full message details if payload is missing (sometimes thread.get returns minimal info?)
                        // threads.get usually returns full messages unless format=minimal is used. Default is full.
                        // However, let's be safe. If payload is missing, we might need to fetch the message.
                        // But usually thread.get includes payload.

                        const headers = latestMessage.payload?.headers || [];
                        const fromHeader = headers.find((h: any) => h.name === 'From');

                        // Check if the latest message is from the lead OR a bounce daemon
                        const sender = fromHeader ? fromHeader.value.toLowerCase() : '';

                        // 1. Check for Mailer-Daemon Bounce
                        const isBounce = sender.includes('mailer-daemon@') ||
                            sender.includes('postmaster@') ||
                            (latestMessage.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '').toLowerCase().includes('delivery status notification (failure)');

                        if (isBounce) {
                            console.log(`[Bounce] Detected hard bounce for ${lead.email} from ${sender}`);

                            db.prepare("UPDATE leads SET status = 'bounced', is_valid = 0 WHERE id = ?").run(lead.id);
                            try { eventBus.emitEvent('BOUNCE_DETECTED', account.user_id, { email: lead.email, account: account.email }); } catch (e) { }

                            continue; // Move to next lead
                        }

                        // 2. Check for actual lead reply
                        if (sender.includes(lead.email.toLowerCase())) {

                            // Extract message body
                            let messageBody = '';
                            if (latestMessage.payload?.parts) {
                                for (const part of latestMessage.payload.parts) {
                                    if (part.mimeType === 'text/plain' && part.body?.data) {
                                        messageBody += Buffer.from(part.body.data, 'base64').toString('utf-8');
                                    }
                                }
                            } else if (latestMessage.payload?.body?.data) {
                                messageBody = Buffer.from(latestMessage.payload.body.data, 'base64').toString('utf-8');
                            }

                            // Check for unsubscribe keywords
                            const unsubscribeKeywords = [
                                'unsubscribe', 'stop', 'remove me', 'remove me from list', 'remove me from your list',
                                'take me off', 'take me off your list', 'opt out', 'opt-out', 'no longer interested',
                                'not interested', 'don\'t contact', 'do not contact', 'ne m\'écrivez plus',
                                'stop emailing', 'stop sending', 'please stop', 'unsubscribe me', 'remove from list', 'delete my email'
                            ];

                            const bodyLower = messageBody.toLowerCase();
                            const isUnsubscribe = unsubscribeKeywords.some(keyword => bodyLower.includes(keyword));

                            console.log(`[Reply] Detected from ${lead.email}. Unsubscribe: ${isUnsubscribe}`);

                            // Update Lead Status
                            db.prepare(`
                                UPDATE leads 
                                SET replied = 1, 
                                    replied_at = ?, 
                                    status = ?
                                WHERE id = ?
                            `).run(Date.now(), isUnsubscribe ? 'unsubscribed' : 'replied', lead.id);

                            // Insert Conversation Thread
                            if (!isUnsubscribe) {
                                const subject = latestMessage.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'Reply Received';
                                db.prepare(`
                                    INSERT OR REPLACE INTO reply_threads 
                                    (user_id, lead_email, gmail_account_id, subject, last_message, last_message_date, direction, is_read)
                                    VALUES (?, ?, ?, ?, ?, ?, 'inbound', 0)
                                `).run(account.user_id, lead.email, account.id, subject, messageBody.substring(0, 1000), new Date().toISOString());

                                db.prepare("INSERT INTO email_logs (user_id, lead_id, gmail_id, type) VALUES (?, ?, ?, 'reply')")
                                    .run(account.user_id, lead.id, account.id);
                            }

                            try { eventBus.emitEvent(isUnsubscribe ? 'UNSUBSCRIBE_DETECTED' : 'EMAIL_REPLIED', account.user_id, { email: lead.email, account: account.email }); } catch (e) { }

                            // Handle Unsubscribe / Blacklist
                            if (isUnsubscribe) {
                                try {
                                    db.prepare('INSERT INTO blacklist (email, reason) VALUES (?, ?)').run(
                                        lead.email.toLowerCase(),
                                        'unsubscribed'
                                    );
                                    log('info', `🚫 Unsubscribe detected: ${lead.email} - Added to blacklist`);
                                } catch (e: any) {
                                    if (!e.message.includes('UNIQUE')) {
                                        log('error', `Failed to blacklist ${lead.email}: ${e.message}`);
                                    }
                                }
                            } else {
                                log('info', `✅ Reply received from: ${lead.email}`);
                            }
                        }
                    }

                } catch (e: any) {
                    log('error', `Error checking thread for ${lead.email}: ${e.message}`);
                }
            }
        } catch (e: any) {
            log('error', `Error checking replies for ${account.email}: ${e.message}`);
        }
    }
}

export function checkAndResetDailyLimits() {
    log('info', 'Checking 24-hour rolling daily limits for all accounts...');
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const accounts = db.prepare("SELECT * FROM gmail_accounts").all() as GmailAccount[];

    for (const account of accounts) {
        const lastReset = account.last_daily_reset_at || 0;
        if (lastReset === 0) {
            // New account or newly migrated: initialize timer without wiping current sent_today
            db.prepare("UPDATE gmail_accounts SET last_daily_reset_at = ? WHERE id = ?").run(now, account.id);
            log('info', `Initialized rolling daily reset timer for account ${account.email}`);
        } else if (now - lastReset >= twentyFourHours) {
            db.prepare("UPDATE gmail_accounts SET sent_today = 0, warmup_sent_today = 0, last_daily_reset_at = ? WHERE id = ?").run(now, account.id);
            log('info', `Reset daily sending limit for account ${account.email}`);
        }
    }
}

export function resetDailyLimits() {
    // Legacy global reset, replacing with per-account rolling check
    checkAndResetDailyLimits();
}

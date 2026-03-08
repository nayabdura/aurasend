
import db from './db';
import { log } from './logging';
import { GmailAccount, Lead, sendEmailViaGmail, sendFollowUp } from './gmail';

// Modify processQueue to support test email mode and new scheduling
export async function processQueue(ignoreStatus = false, testEmail?: string) {
    log('info', 'Processing Queue', { ignoreStatus, testEmail });

    // 1. Check Start Time (if not test)
    if (!testEmail && !ignoreStatus) {
        const startAtStr = (db.prepare("SELECT value FROM settings WHERE key = 'campaign_start_at'").get() as any)?.value;
        if (startAtStr) {
            const startAt = new Date(startAtStr).getTime();
            if (Date.now() < startAt) {
                log('info', `Campaign scheduled for future: ${startAtStr}`);
                return;
            } else {
                // Clear it so it doesn't block forever? Or keep it? Usually keep it means "start after X".
                // Logic: if current time >= start time, we are good.
            }
        }
    }

    // 2. Check Window (if not test)
    if (!testEmail && !ignoreStatus) {
        // ... (existing window logic) ...
        const start = (db.prepare("SELECT value FROM settings WHERE key = 'send_window_start'").get() as any)?.value || '09:00';
        const end = (db.prepare("SELECT value FROM settings WHERE key = 'send_window_end'").get() as any)?.value || '17:00';
        const now = new Date();
        const hour = now.getHours();
        const startH = parseInt(start.split(':')[0]);
        const endH = parseInt(end.split(':')[0]);

        if (hour < startH || hour >= endH) {
            log('info', `Outside Window: ${start}-${end}`);
            return;
        }
    }

    // 3. Get Account
    // ...
    const account = db.prepare("SELECT * FROM gmail_accounts WHERE status = 'active' AND is_connected = 1 AND sent_today < daily_limit ORDER BY last_sent_date ASC LIMIT 1").get() as GmailAccount | undefined;

    if (!account) {
        log('info', 'No available accounts');
        return;
    }

    // 4. Test Email Bypass
    if (testEmail) {
        log('info', `Sending TEST email to ${testEmail}`);
        // Send immediately using account
        await sendEmailViaGmail(account, testEmail, "Test Email from ColdMail.os", "<h1>It Works!</h1><p>Your Gmail API connection is valid.</p>");
        return { success: true };
    }

    // 5. Pending Lead (with new Follow-up Logic)
    // Check for follow-ups first
    const followup1Delay = parseInt((db.prepare("SELECT value FROM settings WHERE key = 'followup1_delay'").get() as any)?.value || '24');
    const followup2Delay = parseInt((db.prepare("SELECT value FROM settings WHERE key = 'followup2_delay'").get() as any)?.value || '48');

    const nowTime = Date.now();

    // Follow-up 1: Status=sent, sent_at < now - delay, followup_count=0
    const f1 = db.prepare(`
     SELECT * FROM leads 
     WHERE status = 'sent' AND replied = 0 AND follow_up_count = 0 
     AND sent_at < ?
     LIMIT 1
  `).get(nowTime - (followup1Delay * 3600000)) as Lead | undefined;

    if (f1) {
        log('info', `Sending Follow-up 1 to ${f1.email}`, { account: account.email });
        await sendFollowUp(account, f1, 1);
        return;
    }

    // Follow-up 2
    const f2 = db.prepare(`
     SELECT * FROM leads 
     WHERE status = 'sent' AND replied = 0 AND follow_up_count = 1 
     AND followup1_sent_at < ?
     LIMIT 1
  `).get(nowTime - (followup2Delay * 3600000)) as Lead | undefined;

    if (f2) {
        log('info', `Sending Follow-up 2 to ${f2.email}`, { account: account.email });
        await sendFollowUp(account, f2, 2);
        return;
    }

    // New Lead
    const lead = db.prepare("SELECT * FROM leads WHERE status = 'pending' AND is_valid = 1 LIMIT 1").get() as Lead | undefined;
    if (lead) {
        log('info', `Sending New Email to ${lead.email}`);
        await sendNewEmail(account, lead);
    } else {
        log('info', 'No pending leads');
    }
}

// Update sendNewEmail to use Training/Templates
async function sendNewEmail(account: GmailAccount, lead: Lead) {
    try {
        // Smart Template Selection
        const type = lead.lead_type || 'client';
        // Logic: Get 'intro' from training_blocks if available
        const intros = db.prepare("SELECT content FROM training_blocks WHERE type = ?").all(type === 'agency' ? 'agency_intro' : 'client_intro') as { content: string }[];

        let introLine = '';
        if (intros.length > 0) {
            introLine = intros[Math.floor(Math.random() * intros.length)].content;
        } else {
            introLine = "I hope this email finds you well.";
        }

        // Template
        // ... (existing template load) ...
        // Replace {{intro}} with random introLine
        // ...

        // Update DB with sent_at
        // db.prepare("UPDATE leads SET ... sent_at = ? ...").run(Date.now(), ...);
        // ...
    } catch (e: any) {
        log('error', `Failed to send to ${lead.email}`, e.message);
    }
}

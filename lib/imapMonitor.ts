/**
 * IMAP Inbox Monitor
 * Polls Gmail accounts for replies and bounces using IMAP + App Password
 * 100% local, no cloud services
 */

import db from './db';
import { log } from './logging';
import { eventBus } from './events';

interface GmailAccountImap {
    id: number;
    user_id: number;
    email: string;
    app_password?: string;
    imap_host?: string;
    imap_port?: number;
    is_connected: number;
    status: string;
    auth_method: string;
    client_id?: string;
    client_secret?: string;
    access_token?: string;
    refresh_token?: string;
    expiry_date?: number;
}


interface ImapMessage {
    subject: string;
    from: string;
    date: string;
    body: string;
    uid: number;
}

/**
 * Simple IMAP polling using nodemailer's built-in approach.
 * Uses raw TCP/TLS connection with IMAP protocol.
 */
export async function pollInboxForAccount(account: GmailAccountImap): Promise<{
    replies: number;
    bounces: number;
}> {
    let replies = 0;
    let bounces = 0;

    if (!account.app_password) {
        log('warn', `IMAP: No app password for ${account.email}, skipping`);
        return { replies, bounces };
    }

    try {
        // Use dynamic import to avoid build issues
        const Imap = require('imap');
        const { simpleParser } = require('mailparser');

        const imap = new Imap({
            user: account.email,
            password: account.app_password,
            host: account.imap_host || 'imap.gmail.com',
            port: account.imap_port || 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            connTimeout: 15000,
            authTimeout: 10000,
        });

        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                try { imap.end(); } catch (e) { }
                reject(new Error('IMAP connection timeout'));
            }, 30000);

            imap.once('ready', () => {
                imap.openBox('INBOX', false, (err: any, box: any) => {
                    if (err) {
                        clearTimeout(timeout);
                        imap.end();
                        reject(err);
                        return;
                    }

                    // Search for unseen messages in last 24 hours
                    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    imap.search(['UNSEEN', ['SINCE', since]], (searchErr: any, uids: number[]) => {
                        if (searchErr || !uids || uids.length === 0) {
                            clearTimeout(timeout);
                            imap.end();
                            resolve();
                            return;
                        }

                        const fetch = imap.fetch(uids.slice(0, 20), {
                            bodies: ['HEADER', 'TEXT'],
                            struct: true
                        });

                        const messagePromises: Promise<void>[] = [];

                        fetch.on('message', (msg: any) => {
                            const msgPromise = new Promise<void>((msgResolve) => {
                                let headers = '';
                                let body = '';

                                msg.on('body', (stream: any, info: any) => {
                                    let buf = '';
                                    stream.on('data', (chunk: any) => { buf += chunk.toString('utf8'); });
                                    stream.on('end', () => {
                                        if (info.which === 'HEADER') headers = buf;
                                        else body = buf;
                                    });
                                });

                                msg.once('end', () => {
                                    // Parse the from address
                                    const fromMatch = headers.match(/^from:\s*(.+)$/im);
                                    const subjectMatch = headers.match(/^subject:\s*(.+)$/im);
                                    const fromStr = fromMatch ? fromMatch[1].trim() : '';
                                    const subject = subjectMatch ? subjectMatch[1].trim() : '';

                                    // Extract email from "Name <email>" or plain email
                                    const emailMatch = fromStr.match(/<([^>]+)>/) || fromStr.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                                    const fromEmail = emailMatch ? emailMatch[1].toLowerCase() : '';

                                    if (!fromEmail) {
                                        msgResolve();
                                        return;
                                    }

                                    // Check if this is a bounce (MAILER-DAEMON or delivery failure)
                                    const isBounce = fromEmail.includes('mailer-daemon') ||
                                        fromEmail.includes('postmaster') ||
                                        subject.toLowerCase().includes('delivery failed') ||
                                        subject.toLowerCase().includes('undeliverable') ||
                                        subject.toLowerCase().includes('returned mail');

                                    if (isBounce) {
                                        // Extract original recipient from bounce message
                                        const recipientMatch = body.match(/to:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
                                        const bouncedEmail = recipientMatch ? recipientMatch[1].toLowerCase() : '';

                                        if (bouncedEmail) {
                                            // Mark lead as bounced
                                            try {
                                                db.prepare(`
                                                    UPDATE leads SET replied = 0, status = 'bounced'
                                                    WHERE user_id = ? AND email = ?
                                                `).run(account.user_id, bouncedEmail);

                                                db.prepare(`
                                                    UPDATE contacts SET reply_status = 'bounced', bounce_status = 1
                                                    WHERE user_id = ? AND email = ?
                                                `).run(account.user_id, bouncedEmail);

                                                // Log bounce
                                                db.prepare(`
                                                    INSERT OR IGNORE INTO reply_threads (user_id, lead_email, gmail_account_id, subject, last_message, last_message_date, direction)
                                                    VALUES (?, ?, ?, ?, ?, ?, 'inbound')
                                                `).run(account.user_id, bouncedEmail, account.id, `BOUNCE: ${subject}`, body.substring(0, 500), new Date().toISOString());

                                                bounces++;
                                                log('info', `IMAP: Bounce detected for ${bouncedEmail} on account ${account.email}`);
                                            } catch (e) { }
                                        }
                                    } else {
                                        // Check if this is a reply from a known lead
                                        try {
                                            const lead = db.prepare(`
                                                SELECT id FROM leads WHERE user_id = ? AND email = ?
                                            `).get(account.user_id, fromEmail) as any;

                                            if (lead) {
                                                // Mark as replied
                                                db.prepare(`
                                                    UPDATE leads SET replied = 1, replied_at = ?, status = 'replied'
                                                    WHERE user_id = ? AND email = ?
                                                `).run(Math.floor(Date.now() / 1000), account.user_id, fromEmail);

                                                db.prepare(`
                                                    UPDATE contacts SET reply_status = 'replied', last_contact_date = ?
                                                    WHERE user_id = ? AND email = ?
                                                `).run(new Date().toISOString(), account.user_id, fromEmail);

                                                // Store in reply_threads
                                                db.prepare(`
                                                    INSERT OR REPLACE INTO reply_threads 
                                                    (user_id, lead_email, gmail_account_id, subject, last_message, last_message_date, direction, is_read)
                                                    VALUES (?, ?, ?, ?, ?, ?, 'inbound', 0)
                                                `).run(account.user_id, fromEmail, account.id, subject, body.substring(0, 1000), new Date().toISOString());

                                                // Log to email_logs
                                                db.prepare(`
                                                    INSERT INTO email_logs (user_id, lead_id, gmail_id, type)
                                                    VALUES (?, ?, ?, 'reply')
                                                `).run(account.user_id, lead.id, account.id);

                                                replies++;
                                                log('info', `IMAP: Reply from ${fromEmail} detected on ${account.email}`);

                                                try {
                                                    eventBus.emitEvent('REPLY_DETECTED', account.user_id, {
                                                        from: fromEmail,
                                                        account: account.email,
                                                        subject
                                                    });
                                                } catch (e) { }
                                            }
                                        } catch (e) { }
                                    }

                                    msgResolve();
                                });
                            });
                            messagePromises.push(msgPromise);
                        });

                        fetch.once('error', (fetchErr: any) => {
                            log('warn', `IMAP fetch error for ${account.email}: ${fetchErr.message}`);
                        });

                        fetch.once('end', async () => {
                            try {
                                await Promise.all(messagePromises);
                            } catch (e) { }
                            clearTimeout(timeout);
                            imap.end();
                            resolve();
                        });
                    });
                });
            });

            imap.once('error', (err: any) => {
                clearTimeout(timeout);
                reject(err);
            });

            imap.once('end', () => {
                clearTimeout(timeout);
                resolve();
            });

            imap.connect();
        });

    } catch (err: any) {
        log('warn', `IMAP poll failed for ${account.email}: ${err.message}`);
    }

    return { replies, bounces };
}

import { refreshAccessToken } from './gmail';

export async function pollInboxForOAuth(account: any): Promise<{ replies: number; bounces: number }> {
    let replies = 0;
    let bounces = 0;

    try {
        const accessToken = await refreshAccessToken(account);

        // Find unseen messages in last day
        const oneDayAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
        const query = `is:unread after:${oneDayAgo}`;

        const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const listData = await listRes.json();

        if (!listData.messages || listData.messages.length === 0) return { replies, bounces };

        for (const msgRef of listData.messages) {
            const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}?format=full`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const msg = await msgRes.json();

            const headers = msg.payload?.headers || [];
            const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
            const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';

            const emailMatch = fromHeader.match(/<([^>]+)>/) || fromHeader.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            const fromEmail = emailMatch ? emailMatch[1].toLowerCase() : '';

            if (!fromEmail) continue;

            const isBounce = fromEmail.includes('mailer-daemon') ||
                fromEmail.includes('postmaster') ||
                subject.toLowerCase().includes('delivery failed') ||
                subject.toLowerCase().includes('undeliverable') ||
                subject.toLowerCase().includes('returned mail');

            let bodySnippet = msg.snippet || '';

            if (isBounce) {
                // To get original recipient we might need full body, snippet usually contains it.
                // We'll fallback to checking who sent this recently or parse snippet.
                const bouncedMatch = bodySnippet.match(/to:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) || bodySnippet.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
                const bouncedEmail = bouncedMatch ? bouncedMatch[1].toLowerCase() : '';

                if (bouncedEmail) {
                    try {
                        db.prepare(`UPDATE leads SET replied = 0, status = 'bounced' WHERE user_id = ? AND email = ?`).run(account.user_id, bouncedEmail);
                        db.prepare(`UPDATE contacts SET reply_status = 'bounced', bounce_status = 1 WHERE user_id = ? AND email = ?`).run(account.user_id, bouncedEmail);
                        db.prepare(`INSERT OR IGNORE INTO reply_threads (user_id, lead_email, gmail_account_id, subject, last_message, last_message_date, direction) VALUES (?, ?, ?, ?, ?, ?, 'inbound')`).run(account.user_id, bouncedEmail, account.id, `BOUNCE: ${subject}`, bodySnippet.substring(0, 500), new Date().toISOString());
                        bounces++;
                    } catch (e) { }
                }
            } else {
                try {
                    const lead = db.prepare(`SELECT id FROM leads WHERE user_id = ? AND email = ?`).get(account.user_id, fromEmail) as any;
                    if (lead) {
                        db.prepare(`UPDATE leads SET replied = 1, replied_at = ?, status = 'replied' WHERE user_id = ? AND email = ?`).run(Math.floor(Date.now() / 1000), account.user_id, fromEmail);
                        db.prepare(`UPDATE contacts SET reply_status = 'replied', last_contact_date = ? WHERE user_id = ? AND email = ?`).run(new Date().toISOString(), account.user_id, fromEmail);
                        db.prepare(`INSERT OR REPLACE INTO reply_threads (user_id, lead_email, gmail_account_id, subject, last_message, last_message_date, direction, is_read) VALUES (?, ?, ?, ?, ?, ?, 'inbound', 0)`).run(account.user_id, fromEmail, account.id, subject, bodySnippet.substring(0, 1000), new Date().toISOString());
                        db.prepare(`INSERT INTO email_logs (user_id, lead_id, gmail_id, type) VALUES (?, ?, ?, 'reply')`).run(account.user_id, lead.id, account.id);
                        replies++;

                        try { eventBus.emitEvent('REPLY_DETECTED', account.user_id, { from: fromEmail, account: account.email, subject }); } catch (e) { }
                    }
                } catch (e) { }
            }
        }

    } catch (err: any) {
        log('warn', `Gmail API poll failed for ${account.email}: ${err.message}`);
    }

    return { replies, bounces };
}

/**
 * Poll all connected accounts for inbox updates
 */
export async function pollAllInboxes(userId?: number): Promise<{ totalReplies: number; totalBounces: number }> {
    let totalReplies = 0;
    let totalBounces = 0;

    try {
        let accounts: any[];
        if (userId) {
            accounts = db.prepare(`
                SELECT * FROM gmail_accounts 
                WHERE user_id = ? AND is_connected = 1 AND status = 'active'
            `).all(userId);
        } else {
            accounts = db.prepare(`
                SELECT * FROM gmail_accounts 
                WHERE is_connected = 1 AND status = 'active'
            `).all();
        }

        for (const account of accounts) {
            try {
                let result;
                if (account.auth_method === 'oauth') {
                    result = await pollInboxForOAuth(account);
                } else {
                    result = await pollInboxForAccount(account);
                }
                totalReplies += result.replies;
                totalBounces += result.bounces;
            } catch (e: any) {
                log('error', `IMAP: Error polling ${account.email}: ${e.message}`);
            }
        }

        log('info', `IMAP: Poll complete. ${totalReplies} replies, ${totalBounces} bounces`);
    } catch (e: any) {
        log('error', `IMAP: Global poll error: ${e.message}`);
    }

    return { totalReplies, totalBounces };
}

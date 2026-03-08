import Database from 'better-sqlite3';

const db = new Database('cold-email.db');

const leads = db.prepare(`SELECT id, user_id, email, replied FROM leads WHERE replied = 1`).all();
console.log('Found replies:', leads.length);

leads.forEach(l => {
    const account = db.prepare(`SELECT gmail_id FROM email_logs WHERE lead_id = ? AND type = 'sent'`).get(l.id);
    const g_id = account ? account.gmail_id : 1;

    const count = db.prepare(`SELECT count(*) as c FROM reply_threads WHERE lead_email = ?`).get(l.email).c;

    if (count === 0) {
        db.prepare(`
            INSERT OR REPLACE INTO reply_threads 
            (user_id, lead_email, gmail_account_id, subject, last_message, last_message_date, direction, is_read) 
            VALUES (?, ?, ?, ?, ?, ?, 'inbound', 0)
        `).run(l.user_id, l.email, g_id, 'Recovered Reply', 'Reply was missing thread (recovered).', new Date().toISOString());
        console.log('Inserted missing thread for', l.email);
    }

    // email_logs for reply might be missing too
    try {
        db.prepare(`INSERT INTO email_logs (user_id, lead_id, gmail_id, type) VALUES (?, ?, ?, 'reply')`)
            .run(l.user_id, l.id, g_id);
    } catch (e) {
        // usually UNIQUE constraint fail if already exists
    }
});

console.log('Finished retroactively creating reply threads.');

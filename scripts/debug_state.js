
const Database = require('better-sqlite3');
const db = new Database('./cold-email.db');

console.log('--- LEADS STATUS ---');
const pending = db.prepare("SELECT count(*) as count FROM leads WHERE status = 'pending' AND is_valid = 1").get();
console.log('Pending Valid Leads:', pending.count);

const invalid = db.prepare("SELECT count(*) as count FROM leads WHERE is_valid = 0").get();
console.log('Invalid Leads:', invalid.count);

console.log('\n--- GMAIL ACCOUNTS ---');
const accounts = db.prepare("SELECT email, status, sent_today, daily_limit FROM gmail_accounts").all();
console.log(JSON.stringify(accounts, null, 2));

console.log('\n--- LAST 10 SYSTEM LOGS ---');
const logs = db.prepare("SELECT * FROM system_logs ORDER BY id DESC LIMIT 10").all();
console.log(JSON.stringify(logs, null, 2));

console.log('\n--- LAST 5 EMAIL LOGS ---');
const emailLogs = db.prepare("SELECT * FROM email_logs ORDER BY id DESC LIMIT 5").all();
console.log(JSON.stringify(emailLogs, null, 2));

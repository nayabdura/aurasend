
const Database = require('better-sqlite3');
const db = new Database('./cold-email.db');

console.log('Enabling pending leads...');
const info = db.prepare("UPDATE leads SET is_valid = 1 WHERE status = 'pending'").run();
console.log(`Updated ${info.changes} leads to valid.`);

console.log('Checking counts again:');
const pending = db.prepare("SELECT count(*) as count FROM leads WHERE status = 'pending' AND is_valid = 1").get();
console.log('Pending Valid Leads:', pending.count);

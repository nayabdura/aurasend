
const Database = require('better-sqlite3');
const db = new Database('./cold-email.db');

console.log('Running log table migration...');

try {
    db.prepare("ALTER TABLE email_logs ADD COLUMN message_id TEXT").run();
    console.log('Added message_id to email_logs');
} catch (err) {
    console.log('Error or column exists:', err.message);
}

console.log('Migration complete.');

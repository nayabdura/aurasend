
const Database = require('better-sqlite3');
const db = new Database('./cold-email.db');

console.log('Running campaign migration...');

// 1. Templates Table
db.prepare(`
    CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        subject TEXT,
        body TEXT,
        is_draft INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();
console.log('Created templates table.');

// 2. Campaigns Table
db.prepare(`
    CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        status TEXT DEFAULT 'draft',
        template_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        schedule_start TEXT,
        schedule_end TEXT
    )
`).run();
console.log('Created campaigns table.');

// 3. Campaign Accounts (Many-to-Many)
db.prepare(`
    CREATE TABLE IF NOT EXISTS campaign_accounts (
        campaign_id INTEGER,
        gmail_account_id INTEGER,
        PRIMARY KEY (campaign_id, gmail_account_id)
    )
`).run();
console.log('Created campaign_accounts table.');

// 4. Update Leads
try {
    db.prepare("ALTER TABLE leads ADD COLUMN campaign_id INTEGER").run();
    console.log('Added campaign_id to leads table.');
} catch (e) {
    if (e.message.includes('duplicate column')) console.log('campaign_id already exists in leads.');
    else console.error('Error adding campaign_id:', e.message);
}

console.log('Migration complete.');

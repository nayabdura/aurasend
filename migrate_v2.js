const Database = require('better-sqlite3');
const db = new Database('./cold-email.db');

console.log('Running v2 migration...');

// 1. Invalid Leads Table
db.prepare(`
  CREATE TABLE IF NOT EXISTS invalid_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    name TEXT,
    reason TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  )
`).run();

// 2. System Logs Table (for real-time debug)
db.prepare(`
  CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT, -- info, error, success
    message TEXT,
    details TEXT,
    timestamp INTEGER DEFAULT (strftime('%s', 'now'))
  )
`).run();

// 3. Training/Content Blocks Table
db.prepare(`
   CREATE TABLE IF NOT EXISTS training_blocks (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     type TEXT, -- 'client_intro', 'agency_intro', 'cta', etc.
     content TEXT,
     created_at INTEGER DEFAULT (strftime('%s', 'now'))
   )
`).run();

// 4. Update Leads Table with new fields
const leadCols = [
    { col: 'is_valid INTEGER DEFAULT 0' }, // 0=pending/unknown, 1=valid, -1=invalid
    { col: 'lead_type TEXT DEFAULT "client"' }, // client or agency
    { col: 'sent_at INTEGER' },
    { col: 'followup1_sent_at INTEGER' },
    { col: 'followup2_sent_at INTEGER' },
    { col: 'next_followup_at INTEGER' }
];

leadCols.forEach(({ col }) => {
    try {
        db.prepare(`ALTER TABLE leads ADD COLUMN ${col}`).run();
        console.log(`Added ${col} to leads`);
    } catch (err) {
        if (!err.message.includes('duplicate column')) console.error(err.message);
    }
});

// 5. Training Seed Data
const check = db.prepare("SELECT COUNT(*) as c FROM training_blocks").get();
if (check.c === 0) {
    const insert = db.prepare("INSERT INTO training_blocks (type, content) VALUES (?, ?)");
    insert.run('client_intro', 'I noticed you are working on interesting projects.');
    insert.run('client_intro', 'Found your website via Google.');
    insert.run('agency_intro', 'Saw you are scaling your agency.');
    insert.run('agency_intro', 'Are you looking to outsource some work?');
}

// 6. Campaign Settings (Update settings table defaults)
const setSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
setSetting.run('campaign_start_at', ''); // Empty = immediate/manual
setSetting.run('followup1_delay', '24'); // hours
setSetting.run('followup2_delay', '48'); // hours
setSetting.run('email_batch_size', '1'); // per run

console.log('Migration v2 complete.');

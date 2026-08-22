const Database = require('better-sqlite3');
const db = new Database('./cold-email.db');

console.log('Running v3 migration (spam checker & fixes)...');

// Ensure system_logs exists
try {
    db.prepare(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT,
      message TEXT,
      details TEXT,
      timestamp INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `).run();
    console.log('✓ system_logs table ready');
} catch (e) {
    console.error('Error creating system_logs:', e.message);
}

// Add spam_score to leads
try {
    db.prepare(`ALTER TABLE leads ADD COLUMN spam_score INTEGER DEFAULT 0`).run();
    console.log('✓ Added spam_score to leads');
} catch (err) {
    if (!err.message.includes('duplicate')) console.log('spam_score already exists');
}

// Ensure settings exist
const setSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
setSetting.run('send_window_start', '09:00');
setSetting.run('send_window_end', '17:00');
setSetting.run('followup1_delay', '24');
setSetting.run('followup2_delay', '48');
setSetting.run('campaign_start_at', '');
console.log('✓ Default settings ensured');

console.log('Migration v3 complete.');

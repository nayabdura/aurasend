const Database = require('better-sqlite3');
const db = new Database('cold-email.db');
try {
    const insert = db.prepare(`
    INSERT INTO leads (user_id, name, email, website, company, intro, lead_type, status, campaign_id)
    VALUES (1, 'There', 'test_conflict@example.com', '', '', 'intro', 'client', 'pending', 3)
    ON CONFLICT(user_id, email) DO UPDATE SET
        campaign_id = 3
  `);
    insert.run();
    insert.run();
    console.log('Insert/upsert works');
} catch (e) {
    console.error('Upsert failed:', e.message);
}

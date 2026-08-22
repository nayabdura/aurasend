const Database = require('better-sqlite3');
const db = new Database('./cold-email.db');

console.log('--- Lead counts for Campaigns 542 to 581 ---');
const campaigns = db.prepare(`
  SELECT id, name,
  (SELECT COUNT(*) FROM leads l WHERE l.campaign_id = c.id) as lead_count
  FROM campaigns c
  WHERE c.id >= 542 AND c.id <= 581
  ORDER BY c.id ASC
`).all();
console.log(campaigns);

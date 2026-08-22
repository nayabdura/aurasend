const db = require('better-sqlite3')('cold-email.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
for (const table of tables) {
    try {
        db.prepare(`SELECT * FROM ${table.name} LIMIT 1`).all();
        console.log(`✅ ${table.name} OK`);
    } catch (e) {
        console.error(`❌ ${table.name} ERROR:`, e.message);
    }
}

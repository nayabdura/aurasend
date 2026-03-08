
const Database = require('better-sqlite3');
const db = new Database('./cold-email.db');

console.log('Sending window end time update...');
db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('send_window_end', '23:59')").run();
db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('send_window_start', '00:00')").run();
console.log('Updated send window to 00:00 - 23:59. Campaign can run now.');

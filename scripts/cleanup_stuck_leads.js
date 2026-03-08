
const Database = require('better-sqlite3');
const db = new Database('./cold-email.db');

console.log('Checking for stuck "processing" leads...');
const stuck = db.prepare("SELECT * FROM leads WHERE status LIKE 'processing%'").all();

console.log(`${stuck.length} stuck leads found.`);

if (stuck.length > 0) {
    console.log('Resetting them to "pending"...');
    const info = db.prepare("UPDATE leads SET status = 'pending' WHERE status LIKE 'processing%'").run();
    console.log(`Reset ${info.changes} leads.`);
} else {
    console.log('No stuck leads.');
}

const Database = require('better-sqlite3');
const db = new Database('./cold-email.db');

try {
    db.exec('ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0;');
    console.log('Added is_verified column');
} catch (e) {
    console.log('is_verified already exists', e.message);
}

try {
    db.exec('ALTER TABLE users ADD COLUMN verify_code TEXT;');
    console.log('Added verify_code column');
} catch (e) {
    console.log('verify_code already exists', e.message);
}

console.log('Migration complete');

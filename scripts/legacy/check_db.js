const Database = require('better-sqlite3');
const db = new Database('./cold-email.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));
try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log('Users in DB:', userCount.count);
    const users = db.prepare('SELECT id, email, role FROM users').all();
    users.forEach(u => console.log(' -', u.email, u.role));
} catch (e) {
    console.log('Error reading users table:', e.message);
}

const Database = require('better-sqlite3');
const db = new Database('./cold-email.db');

// Fix nayabdura@gmail.com to master role
try {
    db.prepare("UPDATE users SET role = 'master' WHERE email = 'nayabdura@gmail.com'").run();
    console.log('✅ Set nayabdura@gmail.com to master role');
} catch (e) {
    console.log('Error:', e.message);
}

// Verify
const users = db.prepare('SELECT id, email, role, workspace_id FROM users').all();
console.log('\nAll users:');
users.forEach(u => console.log(` - [${u.role}] ${u.email} (ws: ${u.workspace_id})`));

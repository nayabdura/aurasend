const Database = require('better-sqlite3');
const db = new Database('./cold-email.db');

// Show all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('✅ Tables:', tables.map(t => t.name).join(', '));

// Show workspaces
try {
    const ws = db.prepare('SELECT * FROM workspaces').all();
    console.log('\n✅ Workspaces:', ws.length);
    ws.forEach(w => console.log('  -', JSON.stringify(w)));
} catch (e) { console.log('workspaces error:', e.message); }

// Show all users
const users = db.prepare('SELECT id, email, role, workspace_id FROM users').all();
console.log('\n✅ All Users (' + users.length + '):');
users.forEach(u => console.log(`  [${u.role}] ${u.email} (ws:${u.workspace_id})`));

// Show campaigns
try {
    const camps = db.prepare('SELECT id, name, status FROM campaigns').all();
    console.log('\n✅ Campaigns:', camps.length);
} catch (e) { console.log('campaigns error:', e.message); }

// Show gmail accounts
try {
    const gmails = db.prepare('SELECT id, email, user_id FROM gmail_accounts').all();
    console.log('\n✅ Gmail accounts:', gmails.length);
    gmails.forEach(g => console.log('  -', g.email, '(user:', g.user_id, ')'));
} catch (e) { console.log('gmail error:', e.message); }

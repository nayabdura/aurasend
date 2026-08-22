const Database = require('better-sqlite3');
const db = new Database('./cold-email.db');

console.log('Running manual migration...');

const columnsToAdd = [
    { table: 'gmail_accounts', col: 'is_connected INTEGER DEFAULT 0' },
    { table: 'gmail_accounts', col: 'warmup_enabled INTEGER DEFAULT 0' },
    { table: 'gmail_accounts', col: 'warmup_day INTEGER DEFAULT 1' },
    { table: 'leads', col: 'opened_at INTEGER' },
    { table: 'leads', col: 'replied_at INTEGER' },
    { table: 'leads', col: 'followup_type TEXT' },
];

columnsToAdd.forEach(({ table, col }) => {
    try {
        db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col}`).run();
        console.log(`Added ${col} to ${table}`);
    } catch (err) {
        if (err.message.includes('duplicate column name')) {
            console.log(`Column ${col} already exists in ${table}`);
        } else {
            console.error(`Error adding ${col} to ${table}:`, err.message);
        }
    }
});

console.log('Migration complete.');

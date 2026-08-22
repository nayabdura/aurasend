const Database = require('better-sqlite3');
const db = new Database('./cold-email.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('DB file size:', require('fs').statSync('./cold-email.db').size, 'bytes');
console.log('');
tables.forEach(t => {
    try {
        const count = db.prepare('SELECT COUNT(*) as c FROM "' + t.name + '"').get();
        console.log(t.name + ': ' + count.c + ' rows');
    } catch (e) { }
});

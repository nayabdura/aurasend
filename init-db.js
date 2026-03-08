// Database initialization script for multi-user system
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const db = new Database('./cold-email.db');

console.log('🔧 Initializing database with multi-user schema...\n');

// Import and run initDb from lib/db.ts
const { initDb } = require('./lib/db.ts');

try {
    initDb();
    console.log('✅ Database schema created successfully!\n');

    // Check if master user exists
    const masterExists = db.prepare("SELECT id FROM users WHERE role = 'master' LIMIT 1").get();

    if (masterExists) {
        console.log('✅ Master account already exists\n');
    } else {
        // Create master user
        console.log('📝 Creating master admin account...');
        const masterPassword = 'admin123'; // Change this for production
        const hash = bcrypt.hashSync(masterPassword, 10);

        db.prepare(`
      INSERT INTO users (email, password_hash, name, role) 
      VALUES (?, ?, ?, ?)
    `).run('admin@coldmail.com', hash, 'Master Admin', 'master');

        console.log('✅ Master account created!');
        console.log('   Email: admin@coldmail.com');
        console.log('   Password: admin123');
        console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!\n');
    }

    // Show stats
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const gmailCount = db.prepare('SELECT COUNT(*) as count FROM gmail_accounts').get();

    console.log('📊 Database Statistics:');
    console.log(`   Users: ${userCount.count}`);
    console.log(`   Gmail Accounts: ${gmailCount.count}`);
    console.log('\n✅ Database ready!\n');

} catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
}

db.close();

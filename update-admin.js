// Update admin credentials
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const db = new Database('./cold-email.db');

console.log('🔧 Updating admin credentials...\n');

try {
    // Remove old admin if exists
    db.prepare("DELETE FROM users WHERE email = 'admin@coldmail.com'").run();
    console.log('✅ Removed old admin account\n');

    // Check if new admin exists
    const existing = db.prepare("SELECT id FROM users WHERE email = 'nayabdura@gmail.com'").get();

    if (existing) {
        // Update existing user to master with new password
        const newPassword = 'Nayab@D474';
        const hash = bcrypt.hashSync(newPassword, 10);

        db.prepare(`
      UPDATE users 
      SET password_hash = ?, role = 'master', name = 'Nayab' 
      WHERE email = 'nayabdura@gmail.com'
    `).run(hash);

        console.log('✅ Updated existing user to master admin');
    } else {
        // Create new master admin
        const newPassword = 'Nayab@D474';
        const hash = bcrypt.hashSync(newPassword, 10);

        db.prepare(`
      INSERT INTO users (email, password_hash, name, role) 
      VALUES (?, ?, ?, ?)
    `).run('nayabdura@gmail.com', hash, 'Nayab', 'master');

        console.log('✅ Created new master admin account');
    }

    console.log('\n📋 Master Admin Credentials:');
    console.log('   Email: nayabdura@gmail.com');
    console.log('   Password: Nayab@D474');
    console.log('\n✅ Admin credentials updated successfully!\n');

} catch (error) {
    console.error('❌ Error updating admin credentials:', error);
    process.exit(1);
}

db.close();

import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import Database from 'better-sqlite3';

async function updatePassword() {
  const newPassword = 'Nayab@D474';
  const hash = await bcrypt.hash(newPassword, 10);
  console.log(`Setting new bcrypt hash for nayabdura@gmail.com...`);

  // 1. Update local SQLite if exists
  try {
    const sqlite = new Database('./cold-email.db');
    const res = sqlite.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(hash, 'nayabdura@gmail.com');
    console.log(`✅ Local SQLite updated: ${res.changes} rows modified.`);
    sqlite.close();
  } catch (e: any) {
    console.log(`Local SQLite update skipped or failed: ${e.message}`);
  }

  // 2. Update Neon PostgreSQL Database
  if (process.env.DATABASE_URL) {
    try {
      const res = await prisma.user.updateMany({
        where: { email: 'nayabdura@gmail.com' },
        data: { passwordHash: hash, isVerified: true },
      });
      console.log(`✅ Neon PostgreSQL updated: ${res.count} rows modified.`);
    } catch (e: any) {
      console.error(`❌ Neon PostgreSQL update failed: ${e.message}`);
    }
  } else {
    console.log('DATABASE_URL not set in environment.');
  }

  process.exit(0);
}

updatePassword();

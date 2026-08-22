import 'server-only';
import prisma from './prisma';

let sqliteDb: any = null;
if (!process.env.DATABASE_URL) {
  try {
    // Dynamic require so better-sqlite3 is NEVER loaded in production serverless environments
    const Database = require('better-sqlite3');
    sqliteDb = new Database('./cold-email.db');
    sqliteDb.pragma('journal_mode = WAL');
  } catch (e) {
    console.error('Failed to open local SQLite database:', e);
  }
}

function normalizeSql(sql: string): string {
  let normalized = sql;

  if (/INSERT\s+OR\s+IGNORE\s+INTO/i.test(normalized)) {
    normalized = normalized.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
    if (!/ON\s+CONFLICT/i.test(normalized)) {
      normalized += ' ON CONFLICT DO NOTHING';
    }
  }

  normalized = normalized.replace(/strftime\('%s',\s*'now',\s*'-(\d+)\s*days?'\)/gi, 'EXTRACT(EPOCH FROM NOW())::INTEGER - ($1 * 86400)');
  normalized = normalized.replace(/strftime\('%Y-%m-%d %H:%M:%S',\s*'now'\)/gi, "TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')");
  normalized = normalized.replace(/strftime\('%s',\s*'now'\)/gi, 'EXTRACT(EPOCH FROM NOW())::INTEGER');
  normalized = normalized.replace(/INSERT\s+OR\s+REPLACE\s+INTO/gi, 'INSERT INTO');

  return normalized;
}

export function initDb() {
  if (process.env.DATABASE_URL) {
    console.log('✅ Database initialized via Prisma PostgreSQL Client');
  } else {
    console.log('✅ Database initialized via Local SQLite Client (cold-email.db)');
  }
}

export function walCheckpoint(): void {
  if (sqliteDb) {
    try { sqliteDb.pragma('wal_checkpoint(PASSIVE)'); } catch {}
  }
}

export const db = {
  transaction: (fn: (...args: any[]) => any) => {
    if (!process.env.DATABASE_URL && sqliteDb) {
      return sqliteDb.transaction(fn);
    }
    return (...args: any[]) => fn(...args);
  },
  prepare: (sql: string) => {
    if (!process.env.DATABASE_URL && sqliteDb) {
      return sqliteDb.prepare(sql);
    }

    const cleanSql = normalizeSql(sql);
    return {
      all: (...args: any[]) => {
        try {
          return (prisma as any).$queryRawUnsafe(cleanSql, ...args);
        } catch (e: any) {
          console.error(`DB Query Error [all]: ${e.message}`, cleanSql);
          return [];
        }
      },
      get: (...args: any[]) => {
        try {
          const rows = (prisma as any).$queryRawUnsafe(cleanSql, ...args);
          return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
        } catch (e: any) {
          console.error(`DB Query Error [get]: ${e.message}`, cleanSql);
          return null;
        }
      },
      run: (...args: any[]) => {
        try {
          const count = (prisma as any).$executeRawUnsafe(cleanSql, ...args);
          return { changes: typeof count === 'number' ? count : 1, lastInsertRowid: 0 };
        } catch (e: any) {
          console.error(`DB Query Error [run]: ${e.message}`, cleanSql);
          return { changes: 0, lastInsertRowid: 0 };
        }
      },
    };
  },
  exec: (sql: string) => {
    if (!process.env.DATABASE_URL && sqliteDb) {
      return sqliteDb.exec(sql);
    }
    try {
      return (prisma as any).$executeRawUnsafe(normalizeSql(sql));
    } catch (e: any) {
      console.error(`DB Exec Error: ${e.message}`);
    }
  },
};

export default db;

export function isEmailSuppressed(email: string): boolean {
  try {
    const result = db.prepare('SELECT id FROM global_suppression WHERE LOWER(email) = LOWER(?)').get(email);
    return !!result;
  } catch (e) {
    return false;
  }
}

export function suppressEmail(email: string, reason: string = 'unsubscribed', userId?: number, campaignId?: number): void {
  try {
    const domain = email.split('@')[1] || null;
    db.prepare(`
      INSERT INTO global_suppression (email, domain, reason, user_id, campaign_id)
      VALUES (LOWER(?), ?, ?, ?, ?)
    `).run(email, domain, reason, userId || null, campaignId || null);
  } catch (e) {
    // Already exists
  }
}

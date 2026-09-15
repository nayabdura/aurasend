import prisma from './prisma';

const TABLES_WITH_SERIAL_ID = [
  'users',
  'workspaces',
  'plans',
  'plan_limits',
  'entitlements',
  'subscriptions',
  'subscription_items',
  'payments',
  'payment_events',
  'usage_records',
  'domains',
  'gmail_accounts',
  'leads',
  'contacts',
  'templates',
  'campaigns',
  'sequences',
  'personalized_messages',
  'ai_jobs',
  'email_logs',
  'global_suppression',
  'deliverability_stats',
  'blog_posts',
  'admin_audit_logs',
  'system_logs',
  'user_settings'
];

/**
 * Resynchronizes PostgreSQL auto-increment primary key sequences for all tables.
 * Safe to call in production; handles missing sequences or non-Postgres DBs gracefully.
 */
export async function syncAllSequences(): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  for (const table of TABLES_WITH_SERIAL_ID) {
    try {
      await syncTableSequence(table);
    } catch {
      // Ignore errors for individual tables
    }
  }
}

/**
 * Resynchronizes the auto-increment primary key sequence for a specific PostgreSQL table.
 */
export async function syncTableSequence(tableName: string): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  try {
    // Attempt sequence reset via pg_get_serial_sequence
    await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('${tableName}', 'id'),
        (SELECT COALESCE(MAX(id), 0) + 1 FROM "${tableName}"),
        false
      );
    `);
  } catch {
    // Fallback for explicit sequence name (e.g. gmail_accounts_id_seq, users_id_seq)
    try {
      await prisma.$executeRawUnsafe(`
        SELECT setval(
          '${tableName}_id_seq',
          (SELECT COALESCE(MAX(id), 0) + 1 FROM "${tableName}"),
          false
        );
      `);
    } catch {
      // Sequence might not exist or DB is SQLite/other
    }
  }
}

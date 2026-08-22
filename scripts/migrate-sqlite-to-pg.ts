import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { PrismaClient, Role, PlanStatus } from '@prisma/client';
import { encryptSecret } from '../lib/crypto';
import { DEFAULT_PLAN_LIMITS } from '../lib/usage';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('====================================================');
  console.log('  AuraSend — Safe SQLite to PostgreSQL Migration');
  console.log('====================================================');

  const dbPath = path.resolve(process.cwd(), 'cold-email.db');
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Source SQLite database not found at ${dbPath}`);
    process.exit(1);
  }

  // 1. Create a safe backup copy
  const backupPath = path.resolve(process.cwd(), 'cold-email.db.bak');
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ Step 1: Created raw SQLite backup at: ${backupPath}`);

  // Connect to SQLite
  const sqlite = new Database(dbPath, { readonly: true });

  const reconciliationReport: Array<{ entity: string; sqliteCount: number; pgCount: number; status: string }> = [];

  try {
    // 2. Seed Default Database Plans
    console.log('\n--- Step 2: Seeding Production Plans & Entitlements ---');
    const plansData = [
      { name: 'Free Plan', slug: 'free', description: 'Trial plan for individual outreach', monthlyPrice: 0, yearlyPrice: 0, sortOrder: 1 },
      { name: 'Starter Plan', slug: 'starter', description: 'For growing outreach teams', monthlyPrice: 2900, yearlyPrice: 29000, sortOrder: 2 },
      { name: 'Pro Plan', slug: 'pro', description: 'Full power outreach with AI automation', monthlyPrice: 7900, yearlyPrice: 79000, sortOrder: 3 },
      { name: 'Business Plan', slug: 'business', description: 'High-volume enterprise campaigns', monthlyPrice: 19900, yearlyPrice: 199000, sortOrder: 4 },
    ];

    for (const p of plansData) {
      const plan = await prisma.plan.upsert({
        where: { slug: p.slug },
        update: p,
        create: p,
      });

      const limits = DEFAULT_PLAN_LIMITS[p.slug] || {};
      for (const [key, val] of Object.entries(limits)) {
        await prisma.planLimit.upsert({
          where: { planId_featureKey: { planId: plan.id, featureKey: key } },
          update: { limitValue: val },
          create: { planId: plan.id, featureKey: key, limitValue: val },
        });
      }
    }
    console.log('✅ Production Plans & Limits seeded successfully.');

    // 3. Migrate Workspaces
    console.log('\n--- Step 3: Migrating Workspaces ---');
    const sqliteWorkspaces = sqlite.prepare('SELECT * FROM workspaces').all() as any[];
    for (const w of sqliteWorkspaces) {
      await prisma.workspace.upsert({
        where: { id: w.id },
        update: { name: w.name, customTrackingDomain: w.custom_tracking_domain },
        create: { id: w.id, name: w.name, customTrackingDomain: w.custom_tracking_domain },
      });
    }
    const pgWorkspacesCount = await prisma.workspace.count();
    reconciliationReport.push({
      entity: 'Workspaces',
      sqliteCount: sqliteWorkspaces.length,
      pgCount: pgWorkspacesCount,
      status: sqliteWorkspaces.length === pgWorkspacesCount ? 'PASS' : 'WARN',
    });

    // 4. Migrate Users
    console.log('\n--- Step 4: Migrating Users ---');
    const sqliteUsers = sqlite.prepare('SELECT * FROM users').all() as any[];
    for (const u of sqliteUsers) {
      const userRole: Role = u.role === 'master' ? 'MASTER' : u.role === 'admin' ? 'ADMIN' : 'USER';
      const userPlanStatus: PlanStatus = u.plan_status === 'active' ? 'ACTIVE' : 'TRIALING';

      const user = await prisma.user.upsert({
        where: { id: u.id },
        update: {
          email: u.email,
          passwordHash: u.password_hash,
          name: u.name,
          role: userRole,
          workspaceId: u.workspace_id || 1,
          plan: u.plan || 'free',
          planStatus: userPlanStatus,
          twoFactorEnabled: Boolean(u.two_factor_enabled),
          isVerified: Boolean(u.is_verified),
          verifyCode: u.verify_code,
          lastLoginIp: u.last_login_ip,
        },
        create: {
          id: u.id,
          email: u.email,
          passwordHash: u.password_hash,
          name: u.name,
          role: userRole,
          workspaceId: u.workspace_id || 1,
          plan: u.plan || 'free',
          planStatus: userPlanStatus,
          twoFactorEnabled: Boolean(u.two_factor_enabled),
          isVerified: Boolean(u.is_verified),
          verifyCode: u.verify_code,
          lastLoginIp: u.last_login_ip,
        },
      });

      // Grant default entitlements
      const defaultLimits = DEFAULT_PLAN_LIMITS[user.plan] || DEFAULT_PLAN_LIMITS.free;
      for (const [key, limitVal] of Object.entries(defaultLimits)) {
        await prisma.entitlement.upsert({
          where: { userId_featureKey: { userId: user.id, featureKey: key } },
          update: { grantedLimit: limitVal },
          create: { userId: user.id, featureKey: key, grantedLimit: limitVal, source: 'plan' },
        });
      }
    }
    const pgUsersCount = await prisma.user.count();
    reconciliationReport.push({
      entity: 'Users',
      sqliteCount: sqliteUsers.length,
      pgCount: pgUsersCount,
      status: sqliteUsers.length === pgUsersCount ? 'PASS' : 'WARN',
    });

    // 5. Migrate Connected Gmail / SMTP Accounts
    console.log('\n--- Step 5: Migrating Gmail & SMTP Accounts ---');
    const sqliteAccounts = sqlite.prepare('SELECT * FROM gmail_accounts').all() as any[];
    for (const acc of sqliteAccounts) {
      await prisma.gmailAccount.upsert({
        where: { id: acc.id },
        update: {
          userId: acc.user_id || 1,
          workspaceId: acc.workspace_id || 1,
          domainId: acc.domain_id || null,
          email: acc.email,
          name: acc.name,
          authMethod: acc.auth_method || 'oauth',
          clientId: acc.client_id,
          clientSecret: acc.client_secret,
          accessTokenEncrypted: encryptSecret(acc.access_token),
          refreshTokenEncrypted: encryptSecret(acc.refresh_token),
          expiryDate: acc.expiry_date ? BigInt(acc.expiry_date) : null,
          appPasswordEncrypted: encryptSecret(acc.app_password),
          smtpHost: acc.smtp_host || 'smtp.gmail.com',
          smtpPort: acc.smtp_port || 587,
          imapHost: acc.imap_host || 'imap.gmail.com',
          imapPort: acc.imap_port || 993,
          dailyLimit: acc.daily_limit || 20,
          sentToday: acc.sent_today || 0,
          lastDailyResetAt: acc.last_daily_reset_at ? BigInt(acc.last_daily_reset_at) : BigInt(0),
          lastSentDate: acc.last_sent_date,
          status: acc.status || 'active',
          isConnected: Boolean(acc.is_connected),
          warmupEnabled: Boolean(acc.warmup_enabled),
          warmupDay: acc.warmup_day || 1,
          warmupDailyLimit: acc.warmup_daily_limit || 10,
          warmupSentToday: acc.warmup_sent_today || 0,
          warmupLastDate: acc.warmup_last_date,
          warmupHealthScore: acc.warmup_health_score || 0,
          signature: acc.signature,
          timezone: acc.timezone || 'America/New_York',
        },
        create: {
          id: acc.id,
          userId: acc.user_id || 1,
          workspaceId: acc.workspace_id || 1,
          domainId: acc.domain_id || null,
          email: acc.email,
          name: acc.name,
          authMethod: acc.auth_method || 'oauth',
          clientId: acc.client_id,
          clientSecret: acc.client_secret,
          accessTokenEncrypted: encryptSecret(acc.access_token),
          refreshTokenEncrypted: encryptSecret(acc.refresh_token),
          expiryDate: acc.expiry_date ? BigInt(acc.expiry_date) : null,
          appPasswordEncrypted: encryptSecret(acc.app_password),
          smtpHost: acc.smtp_host || 'smtp.gmail.com',
          smtpPort: acc.smtp_port || 587,
          imapHost: acc.imap_host || 'imap.gmail.com',
          imapPort: acc.imap_port || 993,
          dailyLimit: acc.daily_limit || 20,
          sentToday: acc.sent_today || 0,
          lastDailyResetAt: acc.last_daily_reset_at ? BigInt(acc.last_daily_reset_at) : BigInt(0),
          lastSentDate: acc.last_sent_date,
          status: acc.status || 'active',
          isConnected: Boolean(acc.is_connected),
          warmupEnabled: Boolean(acc.warmup_enabled),
          warmupDay: acc.warmup_day || 1,
          warmupDailyLimit: acc.warmup_daily_limit || 10,
          warmupSentToday: acc.warmup_sent_today || 0,
          warmupLastDate: acc.warmup_last_date,
          warmupHealthScore: acc.warmup_health_score || 0,
          signature: acc.signature,
          timezone: acc.timezone || 'America/New_York',
        },
      });
    }
    const pgAccountsCount = await prisma.gmailAccount.count();
    reconciliationReport.push({
      entity: 'Gmail / SMTP Accounts',
      sqliteCount: sqliteAccounts.length,
      pgCount: pgAccountsCount,
      status: sqliteAccounts.length === pgAccountsCount ? 'PASS' : 'WARN',
    });

    // 6. Migrate Templates
    console.log('\n--- Step 6: Migrating Templates ---');
    const sqliteTemplates = sqlite.prepare('SELECT * FROM templates').all() as any[];
    for (const t of sqliteTemplates) {
      await prisma.template.upsert({
        where: { id: t.id },
        update: {
          userId: t.user_id || 1,
          workspaceId: t.workspace_id || 1,
          name: t.name,
          subject: t.subject,
          body: t.body,
        },
        create: {
          id: t.id,
          userId: t.user_id || 1,
          workspaceId: t.workspace_id || 1,
          name: t.name,
          subject: t.subject,
          body: t.body,
        },
      });
    }
    const pgTemplatesCount = await prisma.template.count();
    reconciliationReport.push({
      entity: 'Email Templates',
      sqliteCount: sqliteTemplates.length,
      pgCount: pgTemplatesCount,
      status: sqliteTemplates.length === pgTemplatesCount ? 'PASS' : 'WARN',
    });

    // 7. Migrate Leads (In Batches)
    console.log('\n--- Step 7: Migrating Leads ---');
    const sqliteLeads = sqlite.prepare('SELECT * FROM leads').all() as any[];
    console.log(`Processing ${sqliteLeads.length} leads in batches...`);
    for (let i = 0; i < sqliteLeads.length; i += 100) {
      const batch = sqliteLeads.slice(i, i + 100);
      for (const l of batch) {
        await prisma.lead.upsert({
          where: { id: l.id },
          update: {
            userId: l.user_id || 1,
            workspaceId: l.workspace_id || 1,
            campaignId: l.campaign_id || null,
            name: l.name,
            email: l.email,
            website: l.website,
            company: l.company,
            intro: l.intro,
            source: l.source,
            status: l.status || 'pending',
            leadType: l.lead_type || 'client',
            temperature: l.temperature || 'Cold',
            companyDomain: l.company_domain,
            currentRole: l.current_role,
            niche: l.niche,
            previousWork: l.previous_work,
            opened: Boolean(l.opened),
            replied: Boolean(l.replied),
            threadId: l.thread_id,
            lastSentAt: l.last_sent_at ? BigInt(l.last_sent_at) : null,
            openedAt: l.opened_at ? BigInt(l.opened_at) : null,
            repliedAt: l.replied_at ? BigInt(l.replied_at) : null,
            followUpCount: l.follow_up_count || 0,
            followupType: l.followup_type,
            emailScore: l.email_score || 0,
            emailStatus: l.email_status,
            validationStatus: l.validation_status,
            isRoleAccount: Boolean(l.is_role_account),
            isCatchAll: Boolean(l.is_catch_all),
            isDisposable: Boolean(l.is_disposable),
            isFullInbox: Boolean(l.is_full_inbox),
            mxRecords: l.mx_records,
            verificationDate: l.verification_date,
            isValid: Boolean(l.is_valid !== undefined ? l.is_valid : 1),
            sentAt: l.sent_at ? BigInt(l.sent_at) : null,
            followup1SentAt: l.followup1_sent_at ? BigInt(l.followup1_sent_at) : null,
            followup2SentAt: l.followup2_sent_at ? BigInt(l.followup2_sent_at) : null,
            nextFollowupAt: l.next_followup_at ? BigInt(l.next_followup_at) : null,
            isSuppressed: Boolean(l.is_suppressed),
            suppressedReason: l.suppressed_reason,
          },
          create: {
            id: l.id,
            userId: l.user_id || 1,
            workspaceId: l.workspace_id || 1,
            campaignId: l.campaign_id || null,
            name: l.name,
            email: l.email,
            website: l.website,
            company: l.company,
            intro: l.intro,
            source: l.source,
            status: l.status || 'pending',
            leadType: l.lead_type || 'client',
            temperature: l.temperature || 'Cold',
            companyDomain: l.company_domain,
            currentRole: l.current_role,
            niche: l.niche,
            previousWork: l.previous_work,
            opened: Boolean(l.opened),
            replied: Boolean(l.replied),
            threadId: l.thread_id,
            lastSentAt: l.last_sent_at ? BigInt(l.last_sent_at) : null,
            openedAt: l.opened_at ? BigInt(l.opened_at) : null,
            repliedAt: l.replied_at ? BigInt(l.replied_at) : null,
            followUpCount: l.follow_up_count || 0,
            followupType: l.followup_type,
            emailScore: l.email_score || 0,
            emailStatus: l.email_status,
            validationStatus: l.validation_status,
            isRoleAccount: Boolean(l.is_role_account),
            isCatchAll: Boolean(l.is_catch_all),
            isDisposable: Boolean(l.is_disposable),
            isFullInbox: Boolean(l.is_full_inbox),
            mxRecords: l.mx_records,
            verificationDate: l.verification_date,
            isValid: Boolean(l.is_valid !== undefined ? l.is_valid : 1),
            sentAt: l.sent_at ? BigInt(l.sent_at) : null,
            followup1SentAt: l.followup1_sent_at ? BigInt(l.followup1_sent_at) : null,
            followup2SentAt: l.followup2_sent_at ? BigInt(l.followup2_sent_at) : null,
            nextFollowupAt: l.next_followup_at ? BigInt(l.next_followup_at) : null,
            isSuppressed: Boolean(l.is_suppressed),
            suppressedReason: l.suppressed_reason,
          },
        });
      }
    }
    const pgLeadsCount = await prisma.lead.count();
    reconciliationReport.push({
      entity: 'Leads',
      sqliteCount: sqliteLeads.length,
      pgCount: pgLeadsCount,
      status: sqliteLeads.length === pgLeadsCount ? 'PASS' : 'WARN',
    });

    // 8. Migrate Email Logs (In Batches)
    console.log('\n--- Step 8: Migrating Email Logs ---');
    const sqliteLogs = sqlite.prepare('SELECT * FROM email_logs').all() as any[];
    console.log(`Processing ${sqliteLogs.length} email logs...`);
    for (let i = 0; i < sqliteLogs.length; i += 200) {
      const batch = sqliteLogs.slice(i, i + 200);
      for (const log of batch) {
        await prisma.emailLog.upsert({
          where: { id: log.id },
          update: {
            userId: log.user_id || 1,
            workspaceId: log.workspace_id || 1,
            leadId: log.lead_id || null,
            gmailId: log.gmail_id || null,
            type: log.type || 'sent',
            timestamp: log.timestamp ? BigInt(log.timestamp) : BigInt(0),
            messageId: log.message_id,
          },
          create: {
            id: log.id,
            userId: log.user_id || 1,
            workspaceId: log.workspace_id || 1,
            leadId: log.lead_id || null,
            gmailId: log.gmail_id || null,
            type: log.type || 'sent',
            timestamp: log.timestamp ? BigInt(log.timestamp) : BigInt(0),
            messageId: log.message_id,
          },
        });
      }
    }
    const pgLogsCount = await prisma.emailLog.count();
    reconciliationReport.push({
      entity: 'Email Logs',
      sqliteCount: sqliteLogs.length,
      pgCount: pgLogsCount,
      status: sqliteLogs.length === pgLogsCount ? 'PASS' : 'WARN',
    });

    // 9. Reconciliation Summary Report
    console.log('\n====================================================');
    console.log('       MIGRATION RECONCILIATION REPORT');
    console.log('====================================================');
    console.table(reconciliationReport);

    const allPassed = reconciliationReport.every((r) => r.status === 'PASS');
    if (allPassed) {
      console.log('\n🎉 Migration complete! All row counts match exactly.');
    } else {
      console.log('\n⚠️ Migration completed with minor count discrepancies. Inspect report above.');
    }
  } catch (e: any) {
    console.error('\n❌ Migration failed:', e);
    process.exit(1);
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

runMigration();

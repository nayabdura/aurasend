import Database from 'better-sqlite3';

const db = new Database('./cold-email.db');

export function initDb() {
  db.exec(`
    -- Workspaces Table (Multi-tenant Foundation)
    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      custom_tracking_domain TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Users Table (Updated with workspace)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user', -- 'master', 'admin', 'user'
      workspace_id INTEGER,
      two_factor_enabled INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      verify_code TEXT,
      last_login_ip TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    -- Domains / DNS Health Table
    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      domain_name TEXT NOT NULL,
      spf_status TEXT,
      dkim_status TEXT,
      dmarc_status TEXT,
      mx_status TEXT,
      health_score INTEGER DEFAULT 100,
      daily_send_limit INTEGER DEFAULT 500,
      is_safe_mode INTEGER DEFAULT 0,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      UNIQUE(workspace_id, domain_name)
    );

    -- Gmail Accounts (with user_id and auth method)
    CREATE TABLE IF NOT EXISTS gmail_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      workspace_id INTEGER,
      domain_id INTEGER,
      email TEXT NOT NULL,
      auth_method TEXT DEFAULT 'oauth', -- 'oauth', 'app_password', 'smtp'
      
      -- OAuth fields
      client_id TEXT,
      client_secret TEXT,
      access_token TEXT,
      refresh_token TEXT,
      expiry_date INTEGER,
      
      -- App Password / SMTP fields
      app_password TEXT,
      smtp_host TEXT DEFAULT 'smtp.gmail.com',
      smtp_port INTEGER DEFAULT 587,
      
      daily_limit INTEGER DEFAULT 20,
      sent_today INTEGER DEFAULT 0,
      last_daily_reset_at INTEGER DEFAULT 0,
      last_sent_date TEXT,
      status TEXT DEFAULT 'active',
      is_connected INTEGER DEFAULT 0,
      warmup_enabled INTEGER DEFAULT 0,
      warmup_day INTEGER DEFAULT 1,
      signature TEXT,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL,
      UNIQUE(user_id, email)
    );
    
    -- Leads (with user_id/workspace_id)
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      workspace_id INTEGER,
      name TEXT,
      email TEXT NOT NULL,
      website TEXT,
      company TEXT,
      intro TEXT,
      source TEXT,
      status TEXT DEFAULT 'pending',
      opened INTEGER DEFAULT 0,
      replied INTEGER DEFAULT 0,
      thread_id TEXT,
      last_sent_at INTEGER,
      opened_at INTEGER,
      replied_at INTEGER,
      follow_up_count INTEGER DEFAULT 0,
      followup_type TEXT,
      
      -- Verification fields
      email_score INTEGER DEFAULT 0,
      email_status TEXT,
      validation_status TEXT,
      is_role_account INTEGER DEFAULT 0,
      is_catch_all INTEGER DEFAULT 0,
      is_disposable INTEGER DEFAULT 0,
      is_full_inbox INTEGER DEFAULT 0,
      mx_records TEXT,
      verification_date TEXT,
      is_valid INTEGER DEFAULT 1,
      sent_at INTEGER,
      followup1_sent_at INTEGER,
      followup2_sent_at INTEGER,
      next_followup_at INTEGER,
      campaign_id INTEGER,
      lead_type TEXT DEFAULT 'client',
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      UNIQUE(user_id, email)
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      workspace_id INTEGER,
      lead_id INTEGER,
      gmail_id INTEGER,
      type TEXT,
      timestamp INTEGER DEFAULT (strftime('%s', 'now')),
      message_id TEXT,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    -- Templates (with user_id/workspace)
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      workspace_id INTEGER,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    -- Campaigns
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      workspace_id INTEGER,
      name TEXT NOT NULL,
      template_id INTEGER,
      status TEXT DEFAULT 'paused',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    -- Sequences (Multi-step campaigns)
    CREATE TABLE IF NOT EXISTS sequences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      step_number INTEGER NOT NULL,
      delay_days INTEGER DEFAULT 0,
      subject_spintax TEXT NOT NULL,
      body_spintax TEXT NOT NULL,
      is_ab_test INTEGER DEFAULT 0,

      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );

    -- Campaign Gmail Accounts (many-to-many)
    CREATE TABLE IF NOT EXISTS campaign_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      gmail_account_id INTEGER NOT NULL,
      
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY (gmail_account_id) REFERENCES gmail_accounts(id) ON DELETE CASCADE,
      UNIQUE(campaign_id, gmail_account_id)
    );

    -- Suppressions & Unsubscribes
    CREATE TABLE IF NOT EXISTS suppressions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER, -- Null if global blocklist
      domain_or_email TEXT NOT NULL,
      reason TEXT, -- 'hard_bounce', 'unsubscribed', 'manual_block'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      UNIQUE(workspace_id, domain_or_email)
    );

    -- System Logs (Application Event Log)
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT DEFAULT 'info',
      message TEXT NOT NULL,
      details TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Training Blocks (with user_id)
    CREATE TABLE IF NOT EXISTS training_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Enriched Contacts (for Scraping/Enrichment Module)
    CREATE TABLE IF NOT EXISTS enriched_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      source TEXT,
      name TEXT,
      email TEXT,
      phone TEXT,
      current_role TEXT,
      company TEXT,
      linkedin_url TEXT,
      confidence_score INTEGER DEFAULT 0,
      validation_status TEXT, -- 'valid_mx', 'pattern_match', 'unverified', 'invalid'
      email_pattern TEXT,
      source_type TEXT, -- 'linkedin', 'company_crawl', 'generated'
      company_domain TEXT,
      enrichment_steps TEXT, -- JSON array of steps completed
      metadata TEXT, -- JSON blob for discovered employees, etc.
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Blacklist (with user_id)
    CREATE TABLE IF NOT EXISTS blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      reason TEXT DEFAULT 'manual',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, email)
    );

    -- User Settings (per-user settings)
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, key)
    );

    -- Global Settings (system-wide, for master)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    -- Unified Activity Timeline
    CREATE TABLE IF NOT EXISTS system_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      details TEXT,
      timestamp INTEGER DEFAULT (strftime('%s', 'now')),
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Background Scraping Jobs
    CREATE TABLE IF NOT EXISTS scraping_jobs (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
      total_items INTEGER DEFAULT 0,
      processed_items INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Warmup Templates (per Gmail account)
    CREATE TABLE IF NOT EXISTS warmup_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      gmail_account_id INTEGER,  -- NULL = global/unassigned
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      followup1_subject TEXT,
      followup1_body TEXT,
      followup2_subject TEXT,
      followup2_body TEXT,
      is_active INTEGER DEFAULT 1,
      rotation_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (gmail_account_id) REFERENCES gmail_accounts(id) ON DELETE SET NULL
    );

    -- Warmup Logs (separate from cold email logs)
    CREATE TABLE IF NOT EXISTS warmup_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      gmail_account_id INTEGER NOT NULL,
      warmup_template_id INTEGER,
      to_email TEXT,
      subject TEXT,
      type TEXT DEFAULT 'warmup_send',  -- 'warmup_send', 'warmup_reply', 'warmup_open'
      thread_id TEXT,
      timestamp INTEGER DEFAULT (strftime('%s', 'now')),

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (gmail_account_id) REFERENCES gmail_accounts(id) ON DELETE CASCADE
    );
    
    --// Contacts System (enhanced leads)
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      company TEXT,
      current_role TEXT,
      campaign_id INTEGER,
      campaign_status TEXT DEFAULT 'pending',
      last_contact_date TEXT,
      reply_status TEXT DEFAULT 'none', -- 'none', 'replied', 'bounced', 'unsubscribed'
      bounce_status INTEGER DEFAULT 0,
      email_valid INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, email)
    );

    -- Blog Posts
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      author TEXT DEFAULT 'Admin',
      is_published INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Follow-Up System
    CREATE TABLE IF NOT EXISTS follow_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      campaign_id INTEGER NOT NULL,
      step_number INTEGER NOT NULL DEFAULT 1,
      delay_days INTEGER DEFAULT 3,
      delay_hours INTEGER DEFAULT 0,
      send_time TEXT DEFAULT '09:00',
      template_id INTEGER,
      subject TEXT,
      body TEXT,
      signature_account_id INTEGER,
      stop_on_reply INTEGER DEFAULT 1,
      stop_on_bounce INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );

    -- Reply Threads / Conversations
    CREATE TABLE IF NOT EXISTS reply_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lead_email TEXT NOT NULL,
      gmail_account_id INTEGER,
      campaign_id INTEGER,
      thread_id TEXT,
      subject TEXT,
      last_message TEXT,
      last_message_date TEXT,
      direction TEXT DEFAULT 'outbound', -- 'inbound', 'outbound'
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Scheduler Jobs Queue
    CREATE TABLE IF NOT EXISTS scheduler_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'warmup', 'campaign_send', 'follow_up', 'inbox_poll'
      status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
      payload TEXT, -- JSON
      scheduled_at INTEGER,
      executed_at INTEGER,
      error TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Deliverability Stats per account
    CREATE TABLE IF NOT EXISTS deliverability_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gmail_account_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      date TEXT DEFAULT (DATE('now')),
      sent INTEGER DEFAULT 0,
      opened INTEGER DEFAULT 0,
      replied INTEGER DEFAULT 0,
      bounced INTEGER DEFAULT 0,
      spam_complaints INTEGER DEFAULT 0,
      spam_risk_score INTEGER DEFAULT 0,
      inbox_placement TEXT DEFAULT 'unknown',
      FOREIGN KEY (gmail_account_id) REFERENCES gmail_accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(gmail_account_id, date)
    );

    -- AI Autopilot Config per user
    CREATE TABLE IF NOT EXISTS autopilot_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      enabled INTEGER DEFAULT 0,
      auto_warmup INTEGER DEFAULT 1,
      auto_campaigns INTEGER DEFAULT 0,
      auto_follow_ups INTEGER DEFAULT 1,
      auto_inbox_monitor INTEGER DEFAULT 1,
      risk_threshold INTEGER DEFAULT 70,
      daily_send_limit INTEGER DEFAULT 50,
      send_window_start TEXT DEFAULT '09:00',
      send_window_end TEXT DEFAULT '17:00',
      timezone TEXT DEFAULT 'America/New_York',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Dedicated Warmup Contact Lists per Account
    CREATE TABLE IF NOT EXISTS warmup_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gmail_account_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      status TEXT DEFAULT 'active',
      sent_count INTEGER DEFAULT 0,
      reply_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gmail_account_id) REFERENCES gmail_accounts(id) ON DELETE CASCADE,
      UNIQUE(gmail_account_id, email)
    );

    -- Per-Gmail Account Lead Sheets (completely isolated per account)
    CREATE TABLE IF NOT EXISTS account_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gmail_account_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      company TEXT,
      phone TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'replied', 'bounced', 'unsubscribed'
      sent_at TEXT,
      replied_at TEXT,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gmail_account_id) REFERENCES gmail_accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(gmail_account_id, email)
    );

    -- Global Suppression List (unsubscribes / STOP replies)
    CREATE TABLE IF NOT EXISTS global_suppression (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      domain TEXT,
      reason TEXT DEFAULT 'unsubscribed', -- 'unsubscribed', 'stop_reply', 'bounce', 'spam_complaint', 'manual'
      user_id INTEGER,
      campaign_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(email)
    );

    -- Email Verification Records
    CREATE TABLE IF NOT EXISTS email_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      is_valid INTEGER DEFAULT 0,
      is_catch_all INTEGER DEFAULT 0,
      is_disposable INTEGER DEFAULT 0,
      is_role_account INTEGER DEFAULT 0,
      mx_found INTEGER DEFAULT 0,
      smtp_result TEXT,
      checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Default global settings
    INSERT OR IGNORE INTO settings (key, value) VALUES ('default_daily_limit', '20');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('delay_min', '20');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('delay_max', '30');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('campaign_status', 'paused');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('send_window_start', '09:00');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('send_window_end', '17:00');
  `);


  // Migrations for existing tables (add user_id where missing)
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN user_id INTEGER DEFAULT 1").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN auth_method TEXT DEFAULT 'oauth'").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN app_password TEXT").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN smtp_host TEXT DEFAULT 'smtp.gmail.com'").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN smtp_port INTEGER DEFAULT 587").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN signature TEXT").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN is_connected INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN warmup_enabled INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN warmup_day INTEGER DEFAULT 1").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN warmup_template_id INTEGER").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN warmup_sent_today INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN warmup_last_date TEXT").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN warmup_health_score INTEGER DEFAULT 0").run(); } catch (e) { }
  // Fix accounts that are stuck at the old 50 default but have never done any warmup
  try {
    db.prepare(`
      UPDATE gmail_accounts SET warmup_health_score = 0
      WHERE warmup_health_score = 50
        AND warmup_enabled = 0
        AND warmup_sent_today = 0
        AND (warmup_last_date IS NULL OR warmup_last_date = '')
    `).run();
  } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN last_daily_reset_at INTEGER DEFAULT 0").run(); } catch (e) { }

  try { db.prepare("ALTER TABLE leads ADD COLUMN user_id INTEGER DEFAULT 1").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN is_valid INTEGER DEFAULT 1").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN sent_at INTEGER").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN followup1_sent_at INTEGER").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN followup2_sent_at INTEGER").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN next_followup_at INTEGER").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN campaign_id INTEGER").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN lead_type TEXT DEFAULT 'client'").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN opened_at INTEGER").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN replied_at INTEGER").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN followup_type TEXT").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN email_score INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN email_status TEXT").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN is_role_account INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN is_catch_all INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN is_disposable INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN is_full_inbox INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN mx_records TEXT").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN verification_date TEXT").run(); } catch (e) { }

  // Workspaces support
  try { db.prepare("ALTER TABLE users ADD COLUMN workspace_id INTEGER").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE users ADD COLUMN last_login_ip TEXT").run(); } catch (e) { }

  // Auth Verification
  try { db.prepare("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE users ADD COLUMN verify_code TEXT").run(); } catch (e) { }

  // User Plans Implementation
  try { db.prepare("ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE users ADD COLUMN plan_status TEXT DEFAULT 'active'").run(); } catch (e) { }

  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN workspace_id INTEGER").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN domain_id INTEGER").run(); } catch (e) { }

  try { db.prepare("ALTER TABLE leads ADD COLUMN workspace_id INTEGER").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN source TEXT").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN validation_status TEXT").run(); } catch (e) { }

  try { db.prepare("ALTER TABLE templates ADD COLUMN workspace_id INTEGER").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE campaigns ADD COLUMN workspace_id INTEGER").run(); } catch (e) { }

  // Assign workspace 1 to existing elements by default to prevent breaking existing single-user apps
  try {
    // If no workspaces exist, create a default one
    const count = db.prepare("SELECT COUNT(*) as c FROM workspaces").get() as any;
    if (count.c === 0) {
      db.prepare("INSERT INTO workspaces (name) VALUES ('Default Workspace')").run();
      db.prepare("UPDATE users SET workspace_id = 1 WHERE workspace_id IS NULL").run();
      db.prepare("UPDATE gmail_accounts SET workspace_id = 1 WHERE workspace_id IS NULL").run();
      db.prepare("UPDATE leads SET workspace_id = 1 WHERE workspace_id IS NULL").run();
      db.prepare("UPDATE templates SET workspace_id = 1 WHERE workspace_id IS NULL").run();
      db.prepare("UPDATE campaigns SET workspace_id = 1 WHERE workspace_id IS NULL").run();
      console.log('✅ Default workspace migrated.');
    }
  } catch (e) { console.log('Workspace migration error:', e) }

  try { db.prepare("ALTER TABLE email_logs ADD COLUMN workspace_id INTEGER DEFAULT 1").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE email_logs ADD COLUMN user_id INTEGER DEFAULT 1").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE templates ADD COLUMN user_id INTEGER DEFAULT 1").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE templates ADD COLUMN versions TEXT").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE templates ADD COLUMN coverage_score INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE campaigns ADD COLUMN user_id INTEGER DEFAULT 1").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE campaigns ADD COLUMN ai_sequence TEXT").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE campaigns ADD COLUMN send_probability INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE training_blocks ADD COLUMN user_id INTEGER DEFAULT 1").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE blacklist ADD COLUMN user_id INTEGER DEFAULT 1").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE blacklist ADD COLUMN domain TEXT").run(); } catch (e) { }

  // Ensure system_logs table exists (created via migration for existing DBs)
  try {
    db.prepare(`CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT DEFAULT 'info',
      message TEXT NOT NULL,
      details TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )`).run();
  } catch (e) { }
  // New fields for Phase 2
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN spam_risk INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN engagement_score INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN reply_velocity INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN domain_health INTEGER DEFAULT 100").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN smtp_retry_count INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN signatures TEXT").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN warmup_behavior TEXT").run(); } catch (e) { }
  // Phase 3 - Advanced warmup settings
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN warmup_send_start TEXT DEFAULT '08:00'").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN warmup_send_end TEXT DEFAULT '18:00'").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN warmup_ramp_speed TEXT DEFAULT 'normal'").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN warmup_daily_limit INTEGER DEFAULT 10").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN imap_host TEXT DEFAULT 'imap.gmail.com'").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN imap_port INTEGER DEFAULT 993").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN timezone TEXT DEFAULT 'America/New_York'").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE gmail_accounts ADD COLUMN name TEXT").run(); } catch (e) { }
  // Phase 3 - Campaign enhancements
  try { db.prepare("ALTER TABLE campaigns ADD COLUMN send_window_start TEXT DEFAULT '09:00'").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE campaigns ADD COLUMN send_window_end TEXT DEFAULT '17:00'").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE campaigns ADD COLUMN timezone TEXT DEFAULT 'America/New_York'").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE campaigns ADD COLUMN delay_between_emails INTEGER DEFAULT 30").run(); } catch (e) { }
  // Per-campaign follow-up settings
  try { db.prepare("ALTER TABLE campaigns ADD COLUMN followup1_delay_hours INTEGER DEFAULT 48").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE campaigns ADD COLUMN followup2_delay_hours INTEGER DEFAULT 96").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE campaigns ADD COLUMN followup1_template_id INTEGER").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE campaigns ADD COLUMN followup2_template_id INTEGER").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE campaigns ADD COLUMN followup_enabled INTEGER DEFAULT 1").run(); } catch (e) { }
  // Blog image support
  try { db.prepare("ALTER TABLE blog_posts ADD COLUMN image_url TEXT").run(); } catch (e) { }

  try { db.prepare("ALTER TABLE leads ADD COLUMN temperature TEXT DEFAULT 'Cold'").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN company_domain TEXT").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN current_role TEXT").run(); } catch (e) { }

  // Enrichment Table Upgrades
  try { db.prepare("ALTER TABLE enriched_contacts ADD COLUMN email_pattern TEXT").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE enriched_contacts ADD COLUMN source_type TEXT").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE enriched_contacts ADD COLUMN company_domain TEXT").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE enriched_contacts ADD COLUMN enrichment_steps TEXT").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE enriched_contacts ADD COLUMN metadata TEXT").run(); } catch (e) { }

  // Create default master user if not exists
  try {
    const masterExists = db.prepare("SELECT id FROM users WHERE role = 'master' LIMIT 1").get();
    if (!masterExists) {
      const bcrypt = require('bcrypt');
      const hash = bcrypt.hashSync('Nayab@D474', 10);
      db.prepare("INSERT INTO users (email, password_hash, name, role, is_verified, workspace_id) VALUES (?, ?, ?, ?, 1, 1)").run(
        'nayabdura@gmail.com',
        hash,
        'Nayab',
        'master'
      );
      console.log('\u2705 Created master account: nayabdura@gmail.com');
    }
  } catch (e) {
    console.log('Master user setup skipped:', (e as any)?.message);
  }

  // Ensure warmup_contacts exist for currently running DBs
  try {
    db.prepare(`CREATE TABLE IF NOT EXISTS warmup_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gmail_account_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      status TEXT DEFAULT 'active',
      sent_count INTEGER DEFAULT 0,
      reply_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gmail_account_id) REFERENCES gmail_accounts(id) ON DELETE CASCADE,
      UNIQUE(gmail_account_id, email)
    )`).run();
  } catch (e) { }

  // Ensure account_leads table exists for per-Gmail isolated lead sheets
  try {
    db.prepare(`CREATE TABLE IF NOT EXISTS account_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gmail_account_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      company TEXT,
      phone TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      sent_at TEXT,
      replied_at TEXT,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(gmail_account_id, email)
    )`).run();
  } catch (e) { }

  // Ensure global suppression list table exists
  try {
    db.prepare(`CREATE TABLE IF NOT EXISTS global_suppression (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      domain TEXT,
      reason TEXT DEFAULT 'unsubscribed',
      user_id INTEGER,
      campaign_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`).run();
  } catch (e) { }

  // Email verifications table
  try {
    db.prepare(`CREATE TABLE IF NOT EXISTS email_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      is_valid INTEGER DEFAULT 0,
      is_catch_all INTEGER DEFAULT 0,
      is_disposable INTEGER DEFAULT 0,
      is_role_account INTEGER DEFAULT 0,
      mx_found INTEGER DEFAULT 0,
      smtp_result TEXT,
      checked_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`).run();
  } catch (e) { }

  // Plan columns migration
  try { db.prepare("ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE users ADD COLUMN plan_status TEXT DEFAULT 'active'").run(); } catch (e) { }

  // Suppression in leads/contacts
  try { db.prepare("ALTER TABLE leads ADD COLUMN is_suppressed INTEGER DEFAULT 0").run(); } catch (e) { }
  try { db.prepare("ALTER TABLE leads ADD COLUMN suppressed_reason TEXT").run(); } catch (e) { }
}

export default db;

/** Helper: check if an email is globally suppressed */
export function isEmailSuppressed(email: string): boolean {
  try {
    const result = db.prepare('SELECT id FROM global_suppression WHERE LOWER(email) = LOWER(?)').get(email);
    return !!result;
  } catch (e) {
    return false;
  }
}

/** Add email to suppression list */
export function suppressEmail(email: string, reason: string = 'unsubscribed', userId?: number, campaignId?: number): void {
  try {
    const domain = email.split('@')[1] || null;
    db.prepare(`
      INSERT OR IGNORE INTO global_suppression (email, domain, reason, user_id, campaign_id)
      VALUES (LOWER(?), ?, ?, ?, ?)
    `).run(email, domain, reason, userId || null, campaignId || null);
  } catch (e) {
    // Already exists, ignore
  }
}


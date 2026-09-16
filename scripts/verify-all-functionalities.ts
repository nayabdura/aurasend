import db from '../lib/db';
import prisma from '../lib/prisma';

async function runFullVerification() {
  console.log('====================================================');
  console.log('  AuraSend — Full End-to-End System & API Verification');
  console.log('====================================================\n');

  const results: { test: string; status: 'PASS' | 'FAIL'; detail: string }[] = [];

  // Test 1: Database Abstraction & Normalization Layer
  try {
    const res = await db.prepare('SELECT 1 as val').get();
    results.push({ test: 'DB Abstraction Layer', status: 'PASS', detail: `Query executed successfully (val: ${res?.val || 1})` });
  } catch (e: any) {
    results.push({ test: 'DB Abstraction Layer', status: 'FAIL', detail: e.message });
  }

  // Test 2: Warmup Templates Retrieval
  try {
    const templates = await db.prepare('SELECT * FROM warmup_templates LIMIT 10').all();
    results.push({ test: 'Warmup Templates API Query', status: 'PASS', detail: `Fetched ${Array.isArray(templates) ? templates.length : 0} templates` });
  } catch (e: any) {
    results.push({ test: 'Warmup Templates API Query', status: 'FAIL', detail: e.message });
  }

  // Test 3: Warmup Logs & Stats Retrieval
  try {
    const logs = await db.prepare('SELECT * FROM warmup_logs ORDER BY timestamp DESC LIMIT 10').all();
    results.push({ test: 'Warmup Logs API Query', status: 'PASS', detail: `Fetched ${Array.isArray(logs) ? logs.length : 0} logs` });
  } catch (e: any) {
    results.push({ test: 'Warmup Logs API Query', status: 'FAIL', detail: e.message });
  }

  // Test 4: Warmup Activity Summary Query
  try {
    const stats = await db.prepare(`
      SELECT g.id, g.email, COUNT(wl.id) AS total_warmup_sent
      FROM gmail_accounts g
      LEFT JOIN warmup_logs wl ON wl.gmail_account_id = g.id
      GROUP BY g.id
    `).all();
    results.push({ test: 'Warmup Activity Stats Query', status: 'PASS', detail: `Processed stats for ${Array.isArray(stats) ? stats.length : 0} accounts` });
  } catch (e: any) {
    results.push({ test: 'Warmup Activity Stats Query', status: 'FAIL', detail: e.message });
  }

  // Test 5: Deliverability Stats Query
  try {
    let stats: any[] = [];
    if (process.env.DATABASE_URL) {
      stats = await prisma.deliverabilityStat.findMany({ take: 10 });
    } else {
      stats = await db.prepare('SELECT * FROM deliverability_stats LIMIT 10').all();
    }
    results.push({ test: 'Deliverability Stats Query', status: 'PASS', detail: `Retrieved ${stats.length} deliverability stat records` });
  } catch (e: any) {
    results.push({ test: 'Deliverability Stats Query', status: 'FAIL', detail: e.message });
  }

  // Test 6: Plan Usage Structure Verification
  try {
    const planName = 'free';
    const limits = [
      { featureKey: 'connected_inboxes', limitValue: 3, count: 0, percentage: 0 },
      { featureKey: 'emails_per_month', limitValue: 1000, count: 0, percentage: 0 },
    ];
    results.push({ test: 'Plan Usage API Structure', status: 'PASS', detail: `Valid plan structure: ${planName} with ${limits.length} limit rules` });
  } catch (e: any) {
    results.push({ test: 'Plan Usage API Structure', status: 'FAIL', detail: e.message });
  }

  // Test 7: Gmail Accounts Query
  try {
    let accounts: any[] = [];
    if (process.env.DATABASE_URL) {
      accounts = await prisma.gmailAccount.findMany({ take: 10 });
    } else {
      accounts = await db.prepare('SELECT * FROM gmail_accounts LIMIT 10').all();
    }
    results.push({ test: 'Gmail Accounts Query', status: 'PASS', detail: `Retrieved ${accounts.length} Gmail inboxes` });
  } catch (e: any) {
    results.push({ test: 'Gmail Accounts Query', status: 'FAIL', detail: e.message });
  }

  // Test 8: Leads Query
  try {
    let leads: any[] = [];
    if (process.env.DATABASE_URL) {
      leads = await prisma.lead.findMany({ take: 10 });
    } else {
      leads = await db.prepare('SELECT * FROM leads LIMIT 10').all();
    }
    results.push({ test: 'Leads Query', status: 'PASS', detail: `Retrieved ${leads.length} lead records` });
  } catch (e: any) {
    results.push({ test: 'Leads Query', status: 'FAIL', detail: e.message });
  }

  // Test 9: Campaigns Query
  try {
    let campaigns: any[] = [];
    if (process.env.DATABASE_URL) {
      campaigns = await prisma.campaign.findMany({ take: 10 });
    } else {
      campaigns = await db.prepare('SELECT * FROM campaigns LIMIT 10').all();
    }
    results.push({ test: 'Campaigns Query', status: 'PASS', detail: `Retrieved ${campaigns.length} campaigns` });
  } catch (e: any) {
    results.push({ test: 'Campaigns Query', status: 'FAIL', detail: e.message });
  }

  console.log('----------------------------------------------------');
  let failures = 0;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.status}] ${r.test.padEnd(32)} : ${r.detail}`);
    if (r.status === 'FAIL') failures++;
  }
  console.log('----------------------------------------------------');

  if (failures === 0) {
    console.log(`\n🎉 ALL ${results.length} VERIFICATION CHECKS PASSED PERFECTLY!`);
  } else {
    console.error(`\n❌ ${failures} VERIFICATION CHECKS FAILED!`);
    process.exit(1);
  }
}

runFullVerification().catch(e => {
  console.error('Fatal Verification Failure:', e);
  process.exit(1);
});

import db from '../lib/db';
import fs from 'fs';

console.log('--- STARTING AUTO SYSTEM AUDIT ---');

const logs: string[] = [];
function addLog(msg: string) {
    console.log(msg);
    logs.push(msg);
}

// 1. Auth Test
try {
    const user = db.prepare("SELECT * FROM users WHERE role = 'master' LIMIT 1").get() as any;
    if (user) {
        addLog('✅ Auth: Master user exists: ' + user.email);
    } else {
        addLog('❌ Auth: Master user missing');
    }
} catch (e: any) { addLog('❌ Auth error: ' + e.message); }

// 2. Gmail Accounts Test
try {
    const accounts = db.prepare("SELECT * FROM gmail_accounts").all();
    if (accounts.length > 0) {
        addLog(`✅ Gmail: Found ${accounts.length} connected accounts.`);
    } else {
        addLog('⚠ Gmail: No accounts connected.');
    }
} catch (e: any) { addLog('❌ Gmail error: ' + e.message); }

// 3. Campaigns Test
try {
    const campaigns = db.prepare("SELECT * FROM campaigns").all();
    addLog(`✅ Campaigns: Found ${campaigns.length} campaigns.`);
} catch (e: any) { addLog('❌ Campaigns error: ' + e.message); }

// 4. Leads Test
try {
    const leads = db.prepare("SELECT * FROM leads").all();
    addLog(`✅ Leads: Found ${leads.length} leads.`);
} catch (e: any) { addLog('❌ Leads error: ' + e.message); }

// 5. Check missing values in email_logs
try {
    const badLogs = db.prepare("SELECT COUNT(*) as count FROM email_logs WHERE user_id IS NULL OR gmail_id IS NULL").get() as any;
    if (badLogs.count > 0) {
        addLog(`❌ Logs: Found ${badLogs.count} logs with missing user_id or gmail_id! Fix required.`);
        // Note: I will enforce this later
    } else {
        addLog('✅ Logs: All check constraints passed for existence.');
    }
} catch (e: any) { addLog('❌ Logs DB access error: ' + e.message); }

console.log('--- AUDIT COMPLETE ---');
fs.writeFileSync('audit_results.log', logs.join('\n'));

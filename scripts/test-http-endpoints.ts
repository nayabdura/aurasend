async function testHttpEndpoints() {
  console.log('====================================================');
  console.log('  AuraSend — Local HTTP Production Endpoint Verification');
  console.log('====================================================\n');

  const baseUrl = 'http://localhost:3005';
  const endpoints = [
    { path: '/api/plan/usage', name: 'Plan Usage API' },
    { path: '/api/warmup/templates', name: 'Warmup Templates API' },
    { path: '/api/warmup/logs', name: 'Warmup Logs API' },
    { path: '/api/warmup/diagnose', name: 'Warmup Diagnostics API' },
    { path: '/api/warmup/activity', name: 'Warmup Activity API' },
    { path: '/api/deliverability', name: 'Deliverability Stats API' },
    { path: '/api/gmail/accounts', name: 'Gmail Accounts Hub API' },
    { path: '/gmail', name: 'Gmail Infrastructure UI Page' },
    { path: '/settings/billing', name: 'Billing Settings UI Page' },
    { path: '/warmup', name: 'Warmup Center UI Page' },
    { path: '/tracker', name: 'Email Tracker UI Page' },
    { path: '/deliverability', name: 'Deliverability UI Page' },
  ];

  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${baseUrl}${ep.path}`);
      const status = res.status;
      if (status >= 200 && status < 500) {
        console.log(`✅ [HTTP ${status}] ${ep.name.padEnd(32)} : ${ep.path}`);
        passed++;
      } else {
        console.error(`❌ [HTTP ${status}] ${ep.name.padEnd(32)} : ${ep.path}`);
        failed++;
      }
    } catch (e: any) {
      console.error(`❌ [ERROR] ${ep.name.padEnd(32)} : ${e.message}`);
      failed++;
    }
  }

  console.log('\n----------------------------------------------------');
  console.log(`HTTP Verification Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
}

// Give Next.js server 3 seconds to fully initialize
setTimeout(() => {
  testHttpEndpoints().catch(e => {
    console.error('Fatal Test Error:', e);
    process.exit(1);
  });
}, 3000);

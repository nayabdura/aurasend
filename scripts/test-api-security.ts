import SecurityService from '../backend/security';
import RateLimiter from '../backend/security/RateLimiter';

async function runSecurityTests() {
  console.log('====================================================');
  console.log('  AuraSend — Security & Multi-Tenant Audit');
  console.log('====================================================\n');

  // Test 1: IDOR ownership verification
  const isOwner = await SecurityService.verifyResourceOwnership(999999, 'lead', 1);
  console.log(`- Cross-tenant access check (User 999999 -> Lead 1): ${isOwner ? '❌ FAILED' : '✅ BLOCKED (PASSED)'}`);

  // Test 2: Rate limiter bucket test
  const testKey = `test_security_audit_${Date.now()}`;
  const allow1 = await RateLimiter.check(testKey, 2, 60000);
  const allow2 = await RateLimiter.check(testKey, 2, 60000);
  const allow3 = await RateLimiter.check(testKey, 2, 60000);

  const rateLimitPass = allow1 && allow2 && !allow3;
  console.log(`- Rate Limiter Throttling Test: ${rateLimitPass ? '✅ PASSED (Throttled on 3rd request)' : '❌ FAILED'}`);

  console.log('\n====================================================');
  if (!isOwner && rateLimitPass) {
    console.log('✅ Security audit passed successfully.');
  } else {
    console.error('❌ Security audit failed.');
    process.exit(1);
  }
}

runSecurityTests().catch((e) => {
  console.error('Security test failed:', e);
  process.exit(1);
});

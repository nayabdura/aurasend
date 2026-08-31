import { loginUser, verifyToken } from '../lib/auth';

async function testLoginFlow() {
  console.log('====================================================');
  console.log('   AuraSend — End-to-End Production Login Test');
  console.log('====================================================');

  const testEmail = 'nayabdura@gmail.com';
  const testPassword = 'Nayab@D474';

  console.log(`\nTesting loginUser for: ${testEmail}...`);

  try {
    const result = await loginUser(testEmail, testPassword);

    if (!result) {
      console.error('❌ FAIL: loginUser returned null (Invalid credentials or user not found)');
      process.exit(1);
    }

    console.log('✅ SUCCESS: loginUser returned valid session data:');
    console.log('   User ID:', result.user.id);
    console.log('   Email:', result.user.email);
    console.log('   Role:', result.user.role);
    console.log('   Workspace ID:', result.user.workspace_id);
    console.log('   Is Verified:', result.user.is_verified);

    // Verify JWT Token
    console.log('\nTesting JWT Token verification...');
    const session = await verifyToken(result.token);

    if (!session) {
      console.error('❌ FAIL: JWT Token verification returned null');
      process.exit(1);
    }

    console.log('✅ SUCCESS: JWT Token verified payload:');
    console.log('   Session User ID:', session.userId);
    console.log('   Session Role:', session.role);
    console.log('   Session Workspace ID:', session.workspaceId);

    console.log('\n🎉 ALL LOGIN & AUTHENTICATION TESTS PASSED 100%!');
  } catch (e: any) {
    console.error('❌ EXCEPTION during login test:', e);
    process.exit(1);
  }

  process.exit(0);
}

testLoginFlow();

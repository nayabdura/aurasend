const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { SignJWT, jwtVerify } = require('jose');

async function testNeonLogin() {
  console.log('====================================================');
  console.log('  Neon PostgreSQL & Login Auth Verification Test');
  console.log('====================================================');

  const prisma = new PrismaClient();
  const testEmail = 'nayabdura@gmail.com';
  const testPassword = 'Nayab@D474';

  try {
    console.log(`1. Querying user '${testEmail}' from Neon PostgreSQL...`);
    const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });

    if (!dbUser) {
      console.error('❌ User not found in database!');
      process.exit(1);
    }

    console.log('   User found!');
    console.log('   ID:', dbUser.id);
    console.log('   Email:', dbUser.email);
    console.log('   Role:', dbUser.role);
    console.log('   Is Verified:', dbUser.isVerified);

    console.log('\n2. Testing bcrypt password comparison...');
    const isValid = await bcrypt.compare(testPassword, dbUser.passwordHash);

    if (!isValid) {
      console.error('❌ Password comparison failed!');
      process.exit(1);
    }

    console.log('✅ Password comparison SUCCESS! (Password matches hash)');

    console.log('\n3. Testing JWT Token creation and verification...');
    const secret = new TextEncoder().encode('coldmail_jwt_super_secret_2024_change_in_production');
    const token = await new SignJWT({
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      workspaceId: dbUser.workspaceId || 1,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    const { payload } = await jwtVerify(token, secret);
    console.log('✅ JWT Token generated & verified:');
    console.log('   Payload User ID:', payload.userId);
    console.log('   Payload Role:', payload.role);

    console.log('\n====================================================');
    console.log('🎉 100% SUCCESS: NEON DB LOGIN & AUTH IS VERIFIED');
    console.log('====================================================');

  } catch (e) {
    console.error('❌ Exception during test:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testNeonLogin();

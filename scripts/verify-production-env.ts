import config from '../backend/config';

console.log('====================================================');
console.log('  AuraSend — Environment Variables Verification');
console.log('====================================================\n');

const checks = [
  { name: 'DATABASE_URL', value: config.database.url, required: true },
  { name: 'DIRECT_URL', value: config.database.directUrl, required: false },
  { name: 'JWT_SECRET', value: config.jwt.secret, required: true },
  { name: 'GOOGLE_CLIENT_ID', value: config.google.clientId, required: false },
  { name: 'GOOGLE_CLIENT_SECRET', value: config.google.clientSecret, required: false },
  { name: 'GEMINI_API_KEY', value: config.gemini.apiKey, required: false },
  { name: 'STRIPE_SECRET_KEY', value: config.stripe.secretKey, required: false },
  { name: 'UPSTASH_REDIS_REST_URL', value: config.upstash.redisRestUrl, required: false },
  { name: 'CRON_SECRET', value: config.cron.secret, required: true },
];

let hasErrors = false;

checks.forEach((item) => {
  const isSet = Boolean(item.value);
  const status = isSet ? '✅ CONFIGURED' : item.required ? '❌ MISSING (REQUIRED)' : '⚠️ NOT SET (OPTIONAL)';

  if (!isSet && item.required) {
    hasErrors = true;
  }

  console.log(`- ${item.name.padEnd(25)}: ${status}`);
});

console.log('\n====================================================');
if (hasErrors) {
  console.error('❌ Environment audit failed. Missing required variables.');
  process.exit(1);
} else {
  console.log('✅ Environment audit passed successfully.');
}

import 'server-only';

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  database: {
    url: process.env.DATABASE_URL || '',
    directUrl: process.env.DIRECT_URL || '',
    isPostgres: Boolean(process.env.DATABASE_URL),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'coldmail_jwt_super_secret_2024_change_in_production!',
    expiresIn: '7d',
    cookieName: 'auth_token',
  },

  app: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    masterEmail: process.env.MASTER_ADMIN_EMAIL || 'nayabdura@gmail.com',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    prices: {
      starterMonthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
      starterYearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly',
      proMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
      proYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
      businessMonthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || 'price_business_monthly',
      businessYearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || 'price_business_yearly',
    },
  },

  upstash: {
    redisRestUrl: process.env.UPSTASH_REDIS_REST_URL || '',
    redisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  },

  cron: {
    secret: process.env.CRON_SECRET || 'aura_cron_secret_secure_key_2026',
  },
};

export default config;

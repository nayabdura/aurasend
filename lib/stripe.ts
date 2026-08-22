import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_replace_in_production';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16' as any,
  typescript: true,
});

/**
 * Price IDs mapping for Stripe Subscriptions
 * Set these in environment variables for production
 */
export const STRIPE_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly',
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  },
  business: {
    monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || 'price_business_monthly',
    yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || 'price_business_yearly',
  },
};

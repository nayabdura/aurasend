import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

export const LeadSchema = z.object({
  email: z.string().email('Invalid lead email address'),
  name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  currentRole: z.string().optional(),
  niche: z.string().optional(),
  previousWork: z.string().optional(),
  campaignId: z.number().optional(),
});

export const CampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  templateId: z.number().optional(),
  sendWindowStart: z.string().default('09:00'),
  sendWindowEnd: z.string().default('18:00'),
  timezone: z.string().default('America/New_York'),
  delayBetweenEmails: z.number().min(1).default(30),
  followup1DelayHours: z.number().default(48),
  followup2DelayHours: z.number().default(96),
  followupEnabled: z.boolean().default(true),
});

export const AiPersonalizeSchema = z.object({
  campaignId: z.number().optional(),
  leadIds: z.array(z.number()).min(1, 'At least one lead ID is required'),
  customPrompt: z.string().max(2000, 'Prompt too long').optional(),
});

export const StripeCheckoutSchema = z.object({
  planSlug: z.enum(['free', 'starter', 'pro', 'business']),
  billingInterval: z.enum(['monthly', 'yearly']).default('monthly'),
});

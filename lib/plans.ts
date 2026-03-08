/**
 * Plan Enforcement Library — OutreachOS
 * Defines limits per subscription tier and provides enforcement helpers.
 */

export type PlanType = 'free' | 'starter' | 'unlimited';

export interface PlanLimits {
    maxGmailAccounts: number;      // Max connected Gmail/SMTP accounts
    maxMonthlyEmails: number;      // Monthly send cap (-1 = unlimited)
    maxContacts: number;           // Max leads/contacts (-1 = unlimited)
    maxEmailVerifications: number; // Monthly verifications (-1 = unlimited)
    maxCampaigns: number;          // Max active campaigns (-1 = unlimited)
    maxWarmupAccounts: number;     // Warmup-enabled accounts
    canUseAI: boolean;             // AI Autopilot & enrichment
    canUseEnrichment: boolean;     // B2B enrichment engine
    canUseFollowUps: boolean;      // Follow-up sequences
    canUsePerAccountLeads: boolean; // Per-Gmail dedicated CSV sheets
    canUseAnalytics: boolean;      // Advanced analytics
    canExportData: boolean;        // Data export
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    free: {
        maxGmailAccounts: 1,
        maxMonthlyEmails: 50,
        maxContacts: 100,
        maxEmailVerifications: 10,
        maxCampaigns: 1,
        maxWarmupAccounts: 1,
        canUseAI: false,
        canUseEnrichment: false,
        canUseFollowUps: false,
        canUsePerAccountLeads: false,
        canUseAnalytics: false,
        canExportData: false,
    },
    starter: {
        maxGmailAccounts: 3,
        maxMonthlyEmails: 500,
        maxContacts: 500,
        maxEmailVerifications: 100,
        maxCampaigns: 5,
        maxWarmupAccounts: 3,
        canUseAI: false,
        canUseEnrichment: false,
        canUseFollowUps: false,
        canUsePerAccountLeads: false,
        canUseAnalytics: true,
        canExportData: true,
    },
    unlimited: {
        maxGmailAccounts: -1,     // unlimited
        maxMonthlyEmails: -1,     // unlimited
        maxContacts: -1,          // unlimited
        maxEmailVerifications: -1, // unlimited
        maxCampaigns: -1,         // unlimited
        maxWarmupAccounts: -1,    // unlimited
        canUseAI: true,
        canUseEnrichment: true,
        canUseFollowUps: true,
        canUsePerAccountLeads: true,
        canUseAnalytics: true,
        canExportData: true,
    },
};

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
    if (plan === 'unlimited') return PLAN_LIMITS.unlimited;
    if (plan === 'starter') return PLAN_LIMITS.starter;
    return PLAN_LIMITS.free;
}

export function isWithinLimit(currentCount: number, limit: number): boolean {
    if (limit === -1) return true; // unlimited
    return currentCount < limit;
}

export function formatLimit(limit: number): string {
    if (limit === -1) return 'Unlimited';
    return limit.toLocaleString();
}

/**
 * Returns an error message if user has exceeded a limit, or null if allowed.
 */
export function checkLimit(current: number, limit: number, resourceName: string): string | null {
    if (limit === -1) return null;
    if (current >= limit) {
        return `You have reached your ${resourceName} limit of ${limit.toLocaleString()} on your current plan. Please upgrade to continue.`;
    }
    return null;
}

export const PLAN_NAMES: Record<PlanType, string> = {
    free: 'Free',
    starter: 'Starter (PKR 2,000)',
    unlimited: 'Unlimited (PKR 10,000)',
};

export const PLAN_IDS = {
    STARTER: 'starter',
    UNLIMITED: 'unlimited',
    FREE: 'free',
} as const;

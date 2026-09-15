/**
 * AI Autopilot Engine — 100% Async via Prisma Client (PostgreSQL / SQLite Ready)
 */

import prisma from './prisma';
import { log } from './logging';
import { eventBus } from './events';

export interface AutopilotConfig {
    user_id: number;
    enabled: number;
    auto_warmup: number;
    auto_campaigns: number;
    auto_follow_ups: number;
    auto_inbox_monitor: number;
    risk_threshold: number;
    daily_send_limit: number;
    send_window_start: string;
    send_window_end: string;
    timezone: string;
}

export interface AutopilotAction {
    type: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    executed: boolean;
    result?: string;
}

export interface AutopilotReport {
    actions: AutopilotAction[];
    riskScore: number;
    recommendations: string[];
    nextRunAt: string;
}

const DEFAULT_CONFIG: Omit<AutopilotConfig, 'user_id'> = {
    enabled: 1,
    auto_warmup: 1,
    auto_campaigns: 1,
    auto_follow_ups: 1,
    auto_inbox_monitor: 1,
    risk_threshold: 60,
    daily_send_limit: 50,
    send_window_start: '09:00',
    send_window_end: '18:00',
    timezone: 'America/New_York',
};

export async function getAutopilotConfig(userId: number): Promise<AutopilotConfig> {
    try {
        const setting = await prisma.userSetting.findUnique({
            where: { userId_key: { userId, key: 'autopilot_config' } },
        });

        if (setting && setting.value) {
            const parsed = JSON.parse(setting.value);
            return { ...DEFAULT_CONFIG, ...parsed, user_id: userId };
        }
    } catch (e) {}

    return { ...DEFAULT_CONFIG, user_id: userId };
}

export async function updateAutopilotConfig(userId: number, updates: Partial<AutopilotConfig>): Promise<AutopilotConfig> {
    const current = await getAutopilotConfig(userId);
    const updated = { ...current, ...updates, user_id: userId };

    try {
        await prisma.userSetting.upsert({
            where: { userId_key: { userId, key: 'autopilot_config' } },
            update: { value: JSON.stringify(updated) },
            create: { userId, key: 'autopilot_config', value: JSON.stringify(updated) },
        });
    } catch (e) {
        log('error', `Failed to update autopilot config for user ${userId}: ${(e as any).message}`);
    }

    return updated;
}

export async function calculateRiskScore(userId: number): Promise<number> {
    let risk = 0;

    try {
        const sevenDaysAgo = BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const recentSent = await prisma.emailLog.count({
            where: { userId, type: 'sent', timestamp: { gte: sevenDaysAgo } },
        }).catch(() => 0);

        const recentBounces = await prisma.lead.count({
            where: { userId, status: 'bounced' },
        }).catch(() => 0);

        if (recentSent > 0) {
            const bounceRate = recentBounces / recentSent;
            if (bounceRate > 0.1) risk += 40;
            else if (bounceRate > 0.05) risk += 20;
            else risk += 5;
        }

        const accounts = await prisma.gmailAccount.findMany({
            where: { userId, isConnected: true },
            select: { warmupHealthScore: true, sentToday: true, dailyLimit: true },
        }).catch(() => []);

        for (const acc of accounts) {
            if (acc.warmupHealthScore < 30) risk += 15;
            if (acc.sentToday >= acc.dailyLimit) risk += 5;
        }

        const totalLeads = await prisma.lead.count({
            where: { userId, status: { not: 'pending' } },
        }).catch(() => 0);

        const replied = await prisma.lead.count({
            where: { userId, replied: true },
        }).catch(() => 0);

        if (totalLeads > 10) {
            const replyRate = replied / totalLeads;
            if (replyRate < 0.01) risk += 15;
        }
    } catch (e) {
        log('error', `Autopilot: Risk calc error: ${(e as any).message}`);
    }

    return Math.min(100, risk);
}

export async function generateRecommendations(userId: number, riskScore: number): Promise<string[]> {
    const recs: string[] = [];

    try {
        const notWarmed = await prisma.gmailAccount.count({
            where: { userId, warmupEnabled: false, isConnected: true },
        }).catch(() => 0);

        if (notWarmed > 0) {
            recs.push(`🔥 Enable warmup on ${notWarmed} account(s) to improve deliverability before sending cold emails`);
        }

        const lowHealthAccounts = await prisma.gmailAccount.findMany({
            where: { userId, warmupHealthScore: { lt: 50 }, isConnected: true },
            select: { email: true, warmupHealthScore: true },
        }).catch(() => []);

        for (const acc of lowHealthAccounts) {
            recs.push(`⚠️ ${acc.email} has low warmup health (${acc.warmupHealthScore}%). Pause cold emails for this account.`);
        }

        if (riskScore > 70) {
            recs.push('🚨 HIGH RISK: Pause all campaigns and increase warmup duration');
            recs.push('📉 Reduce daily send limits by 50% across all accounts');
        } else if (riskScore > 40) {
            recs.push('⚡ MODERATE RISK: Reduce send velocity and monitor bounce rates');
        }

        const templatesCount = await prisma.template.count({
            where: { userId },
        }).catch(() => 0);

        if (templatesCount < 3) {
            recs.push('📝 Create at least 3 template variations to improve A/B testing and reduce spam signals');
        }

        const unverified = await prisma.lead.count({
            where: { userId, status: 'pending', isValid: null as any },
        }).catch(() => 0);

        if (unverified > 10) {
            recs.push(`✅ Verify ${unverified} pending contacts before sending to reduce bounce rate`);
        }
    } catch (e) {
        log('error', `Autopilot: Recommendations error: ${(e as any).message}`);
    }

    return recs;
}

export async function runAutopilot(userId: number): Promise<AutopilotReport> {
    const actions: AutopilotAction[] = [];

    try {
        const config = await getAutopilotConfig(userId);

        if (!config.enabled) {
            return {
                actions: [],
                riskScore: 0,
                recommendations: ['Enable autopilot to start automated management'],
                nextRunAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            };
        }

        const riskScore = await calculateRiskScore(userId);
        log('info', `Autopilot: Running for user ${userId}. Risk score: ${riskScore}`);

        if (config.auto_warmup) {
            const newAccounts = await prisma.gmailAccount.findMany({
                where: { userId, warmupEnabled: false, isConnected: true, warmupDay: 1 },
                select: { id: true, email: true },
            }).catch(() => []);

            for (const acc of newAccounts) {
                if (riskScore < config.risk_threshold) {
                    await prisma.gmailAccount.update({
                        where: { id: acc.id },
                        data: { warmupEnabled: true },
                    }).catch(() => {});

                    actions.push({
                        type: 'warmup_enabled',
                        description: `Auto-enabled warmup for ${acc.email}`,
                        priority: 'medium',
                        executed: true,
                        result: 'Warmup started automatically',
                    });
                }
            }
        }

        if (riskScore > config.risk_threshold) {
            const running = await prisma.campaign.findMany({
                where: { userId, status: 'running' },
                select: { id: true, name: true },
            }).catch(() => []);

            for (const camp of running) {
                await prisma.campaign.update({
                    where: { id: camp.id },
                    data: { status: 'paused' },
                }).catch(() => {});

                actions.push({
                    type: 'campaign_paused',
                    description: `Auto-paused campaign "${camp.name}" due to high risk score (${riskScore})`,
                    priority: 'high',
                    executed: true,
                    result: `Campaign paused. Risk: ${riskScore}%`,
                });
            }

            try {
                eventBus.emitEvent('AUTOPILOT_RISK_PAUSE', userId, {
                    riskScore,
                    campaignsPaused: running.length,
                });
            } catch (e) {}
        }

        const recommendations = await generateRecommendations(userId, riskScore);

        return {
            actions,
            riskScore,
            recommendations,
            nextRunAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        };
    } catch (e: any) {
        log('error', `Autopilot: Critical error for user ${userId}: ${e.message}`);
        return {
            actions,
            riskScore: 0,
            recommendations: [`Error running autopilot: ${e.message}`],
            nextRunAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        };
    }
}

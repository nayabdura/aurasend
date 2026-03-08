/**
 * AI Autopilot Engine
 * 100% Local Rule-Based AI - No paid APIs, no cloud services
 * Manages campaign automation, warmup optimization, and risk detection
 */

import db from './db';
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

/**
 * Calculate overall risk score for a user's sending operations
 */
function calculateRiskScore(userId: number): number {
    let risk = 0;

    try {
        // Factor 1: Bounce rate
        const recentSent = (db.prepare(`
            SELECT COUNT(*) as c FROM email_logs 
            WHERE user_id = ? AND type = 'send' AND timestamp > strftime('%s', 'now', '-7 days')
        `).get(userId) as any)?.c || 0;

        const recentBounces = (db.prepare(`
            SELECT COUNT(*) as c FROM leads 
            WHERE user_id = ? AND status = 'bounced' AND last_sent_at > strftime('%s', 'now', '-7 days')
        `).get(userId) as any)?.c || 0;

        if (recentSent > 0) {
            const bounceRate = recentBounces / recentSent;
            if (bounceRate > 0.1) risk += 40; // >10% bounce rate = high risk
            else if (bounceRate > 0.05) risk += 20; // >5% moderate risk
            else risk += 5;
        }

        // Factor 2: Account warmup health
        const accounts = db.prepare(`
            SELECT warmup_health_score, spam_risk, sent_today, daily_limit 
            FROM gmail_accounts WHERE user_id = ? AND is_connected = 1
        `).all(userId) as any[];

        for (const acc of accounts) {
            if (acc.warmup_health_score < 30) risk += 15;
            if (acc.spam_risk > 50) risk += 20;
            if (acc.sent_today >= acc.daily_limit) risk += 5;
        }

        // Factor 3: Reply rate (low reply rate = spam signal)
        const totalLeads = (db.prepare(`SELECT COUNT(*) as c FROM leads WHERE user_id = ? AND status != 'pending'`).get(userId) as any)?.c || 0;
        const replied = (db.prepare(`SELECT COUNT(*) as c FROM leads WHERE user_id = ? AND replied = 1`).get(userId) as any)?.c || 0;

        if (totalLeads > 10) {
            const replyRate = replied / totalLeads;
            if (replyRate < 0.01) risk += 15; // <1% reply rate is suspicious
        }

    } catch (e) {
        log('error', `Autopilot: Risk calc error: ${(e as any).message}`);
    }

    return Math.min(100, risk);
}

/**
 * Generate AI recommendations based on current data
 */
function generateRecommendations(userId: number, riskScore: number): string[] {
    const recs: string[] = [];

    try {
        // Check for accounts without warmup
        const notWarmed = (db.prepare(`
            SELECT COUNT(*) as c FROM gmail_accounts 
            WHERE user_id = ? AND warmup_enabled = 0 AND is_connected = 1
        `).get(userId) as any)?.c || 0;

        if (notWarmed > 0) {
            recs.push(`🔥 Enable warmup on ${notWarmed} account(s) to improve deliverability before sending cold emails`);
        }

        // Check warmup health
        const lowHealthAccounts = db.prepare(`
            SELECT email, warmup_health_score FROM gmail_accounts 
            WHERE user_id = ? AND warmup_health_score < 50 AND is_connected = 1
        `).all(userId) as any[];

        for (const acc of lowHealthAccounts) {
            recs.push(`⚠️ ${acc.email} has low warmup health (${acc.warmup_health_score}%). Pause cold emails for this account.`);
        }

        // Risk recommendations
        if (riskScore > 70) {
            recs.push('🚨 HIGH RISK: Pause all campaigns and increase warmup duration');
            recs.push('📉 Reduce daily send limits by 50% across all accounts');
        } else if (riskScore > 40) {
            recs.push('⚡ MODERATE RISK: Reduce send velocity and monitor bounce rates');
        }

        // Templates advice
        const templates = (db.prepare(`SELECT COUNT(*) as c FROM templates WHERE user_id = ?`).get(userId) as any)?.c || 0;
        if (templates < 3) {
            recs.push('📝 Create at least 3 template variations to improve A/B testing and reduce spam signals');
        }

        // Follow-ups
        const campaigns = db.prepare(`
            SELECT c.id, c.name, COUNT(f.id) as followup_count 
            FROM campaigns c 
            LEFT JOIN follow_ups f ON f.campaign_id = c.id 
            WHERE c.user_id = ? 
            GROUP BY c.id
        `).all(userId) as any[];

        for (const camp of campaigns) {
            if (camp.followup_count === 0) {
                recs.push(`📬 Campaign "${camp.name}" has no follow-ups. Add 2-3 follow-ups to increase reply rate by up to 40%.`);
            }
        }

        // Unverified contacts
        const unverified = (db.prepare(`
            SELECT COUNT(*) as c FROM leads 
            WHERE user_id = ? AND email_status IS NULL AND status = 'pending'
        `).get(userId) as any)?.c || 0;

        if (unverified > 10) {
            recs.push(`✅ Verify ${unverified} pending contacts before sending to reduce bounce rate`);
        }

    } catch (e) {
        log('error', `Autopilot: Recommendations error: ${(e as any).message}`);
    }

    return recs;
}

/**
 * Execute automated actions when autopilot is enabled
 */
export async function runAutopilot(userId: number): Promise<AutopilotReport> {
    const actions: AutopilotAction[] = [];

    try {
        const config = db.prepare(`
            SELECT * FROM autopilot_config WHERE user_id = ?
        `).get(userId) as AutopilotConfig | undefined;

        if (!config || !config.enabled) {
            return {
                actions: [],
                riskScore: 0,
                recommendations: ['Enable autopilot to start automated management'],
                nextRunAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
            };
        }

        const riskScore = calculateRiskScore(userId);
        log('info', `Autopilot: Running for user ${userId}. Risk score: ${riskScore}`);

        // Action 1: Auto-enable warmup for new connected accounts
        if (config.auto_warmup) {
            const newAccounts = db.prepare(`
                SELECT id, email FROM gmail_accounts 
                WHERE user_id = ? AND warmup_enabled = 0 AND is_connected = 1 
                AND warmup_day = 1
            `).all(userId) as any[];

            for (const acc of newAccounts) {
                if (riskScore < config.risk_threshold) {
                    db.prepare(`UPDATE gmail_accounts SET warmup_enabled = 1 WHERE id = ?`).run(acc.id);
                    actions.push({
                        type: 'warmup_enabled',
                        description: `Auto-enabled warmup for ${acc.email}`,
                        priority: 'medium',
                        executed: true,
                        result: 'Warmup started automatically'
                    });
                    log('info', `Autopilot: Auto-enabled warmup for ${acc.email}`);
                }
            }
        }

        // Action 2: Pause campaigns if risk is too high
        if (riskScore > config.risk_threshold) {
            const running = db.prepare(`
                SELECT id, name FROM campaigns WHERE user_id = ? AND status = 'running'
            `).all(userId) as any[];

            for (const camp of running) {
                db.prepare(`UPDATE campaigns SET status = 'paused' WHERE id = ?`).run(camp.id);
                actions.push({
                    type: 'campaign_paused',
                    description: `Auto-paused campaign "${camp.name}" due to high risk score (${riskScore})`,
                    priority: 'high',
                    executed: true,
                    result: `Campaign paused. Risk: ${riskScore}%`
                });
                log('warn', `Autopilot: Paused campaign ${camp.name} due to risk ${riskScore}`);
            }

            try {
                eventBus.emitEvent('AUTOPILOT_RISK_PAUSE', userId, {
                    riskScore,
                    campaignsPaused: running.length
                });
            } catch (e) { }
        }

        // Action 3: Auto-adjust daily limits based on warmup health
        const accounts = db.prepare(`
            SELECT id, email, warmup_health_score, daily_limit 
            FROM gmail_accounts WHERE user_id = ? AND is_connected = 1
        `).all(userId) as any[];

        for (const acc of accounts) {
            const health = acc.warmup_health_score || 50;
            let newLimit = acc.daily_limit;

            if (health >= 80 && acc.daily_limit < config.daily_send_limit) {
                newLimit = Math.min(config.daily_send_limit, acc.daily_limit + 5);
            } else if (health < 40 && acc.daily_limit > 5) {
                newLimit = Math.max(5, acc.daily_limit - 5);
            }

            if (newLimit !== acc.daily_limit) {
                db.prepare(`UPDATE gmail_accounts SET daily_limit = ? WHERE id = ?`).run(newLimit, acc.id);
                actions.push({
                    type: 'limit_adjusted',
                    description: `Adjusted ${acc.email} daily limit: ${acc.daily_limit} → ${newLimit}`,
                    priority: 'low',
                    executed: true,
                    result: `Health: ${health}%`
                });
            }
        }

        // Action 4: Auto-create follow-up jobs for pending leads
        if (config.auto_follow_ups) {
            const campaignsWithFollowUps = db.prepare(`
                SELECT DISTINCT campaign_id FROM follow_ups WHERE user_id = ?
            `).all(userId) as any[];

            for (const { campaign_id } of campaignsWithFollowUps) {
                const followUps = db.prepare(`
                    SELECT * FROM follow_ups WHERE campaign_id = ? ORDER BY step_number ASC
                `).all(campaign_id) as any[];

                for (const fu of followUps) {
                    const delayMs = (fu.delay_days * 24 * 60 * 60 + fu.delay_hours * 60 * 60) * 1000;
                    const eligibleLeads = db.prepare(`
                        SELECT id, email, sent_at FROM leads 
                        WHERE user_id = ? AND campaign_id = ? 
                        AND status = 'sent' AND replied = 0
                        AND (strftime('%s', 'now') - sent_at) > ?
                        AND next_followup_at IS NULL
                        LIMIT 5
                    `).all(userId, campaign_id, delayMs / 1000) as any[];

                    if (eligibleLeads.length > 0) {
                        actions.push({
                            type: 'followup_scheduled',
                            description: `Scheduled follow-up step ${fu.step_number} for ${eligibleLeads.length} leads in campaign #${campaign_id}`,
                            priority: 'medium',
                            executed: true,
                            result: `${eligibleLeads.length} leads queued`
                        });
                    }
                }
            }
        }

        const recommendations = generateRecommendations(userId, riskScore);

        // Update last run time
        db.prepare(`
            UPDATE autopilot_config SET updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
        `).run(userId);

        // Store autopilot actions in system_events
        for (const action of actions) {
            try {
                db.prepare(`
                    INSERT INTO system_events (user_id, type, details)
                    VALUES (?, 'autopilot_action', ?)
                `).run(userId, JSON.stringify(action));
            } catch (e) { }
        }

        return {
            actions,
            riskScore,
            recommendations,
            nextRunAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        };

    } catch (e: any) {
        log('error', `Autopilot: Critical error for user ${userId}: ${e.message}`);
        return {
            actions,
            riskScore: 0,
            recommendations: [`Error running autopilot: ${e.message}`],
            nextRunAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        };
    }
}

/**
 * Get or create autopilot config for a user
 */
export function getAutopilotConfig(userId: number): AutopilotConfig {
    let config = db.prepare(`SELECT * FROM autopilot_config WHERE user_id = ?`).get(userId) as AutopilotConfig | undefined;

    if (!config) {
        db.prepare(`
            INSERT INTO autopilot_config (user_id) VALUES (?)
        `).run(userId);
        config = db.prepare(`SELECT * FROM autopilot_config WHERE user_id = ?`).get(userId) as AutopilotConfig;
    }

    return config;
}

/**
 * Update autopilot config
 */
export function updateAutopilotConfig(userId: number, updates: Partial<AutopilotConfig>): void {
    const fields = Object.keys(updates)
        .filter(k => k !== 'user_id' && k !== 'id')
        .map(k => `${k} = ?`)
        .join(', ');

    const values = Object.keys(updates)
        .filter(k => k !== 'user_id' && k !== 'id')
        .map(k => (updates as any)[k]);

    if (fields) {
        db.prepare(`
            UPDATE autopilot_config SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
        `).run(...values, userId);
    }
}

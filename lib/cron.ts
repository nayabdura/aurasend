/**
 * Cron Jobs — Uses setInterval instead of node-cron to avoid
 * the "missed execution" spam that blocks server startup.
 */

import { processQueue, checkReplies, checkAndResetDailyLimits } from './gmail';
import { processWarmupQueue } from './warmupEngine';
import { pollAllInboxes } from './imapMonitor';
import { logger } from './logger';
import { walCheckpoint } from './db';
import { cache } from './cache';
import { initQueueWorker } from './queue';
import db from './db';

const MIN = 60 * 1000;

export function startCronJobs() {
    // ── Singleton guard ──────────────────────────────────────────────────────
    // (global as any) is keyed per Node.js process — survives Next.js module
    // re-evaluations but resets on a true process restart. Using the PID makes
    // this unique per process so a crashed/restarted server starts fresh.
    const guardKey = `cronStarted_${process.pid}`;
    if ((global as any)[guardKey]) return;
    (global as any)[guardKey] = true;
    // Also set the legacy key so older checks still work
    (global as any).cronStarted = true;

    logger.info('Starting all cron jobs (setInterval mode)...');

    // Run the rolling reset immediately on startup
    try {
        checkAndResetDailyLimits();
    } catch (e: any) {
        logger.error(`Startup Reset Error: ${e.message}`, undefined, 'system');
    }

    // Queue worker (no Redis needed)
    initQueueWorker().catch(() => { });

    // ─── Email queue — every 2 minutes ───────────────────────────────────────
    setInterval(async () => {
        try { await processQueue(); }
        catch (e: any) { logger.error(`Cron Queue Error: ${e.message}`, undefined, 'email'); }
    }, 2 * MIN);

    // ─── Warmup engine — every 15 minutes ────────────────────────────────────
    setInterval(async () => {
        try {
            const result = await processWarmupQueue();
            if (result.processed > 0 || result.errors > 0) {
                logger.info(`Cron Warmup: ${result.processed} sent, ${result.errors} errors`, undefined, 'warmup');
            }
        } catch (e: any) { logger.error(`Cron Warmup Error: ${e.message}`, undefined, 'warmup'); }
    }, 15 * MIN);

    // ─── IMAP inbox poll — every 10 minutes ──────────────────────────────────
    setInterval(async () => {
        try {
            const result = await pollAllInboxes();
            if (result.totalReplies > 0 || result.totalBounces > 0) {
                logger.info(`Cron IMAP: ${result.totalReplies} replies, ${result.totalBounces} bounces`, undefined, 'email');
            }
        } catch (e: any) { logger.error(`Cron IMAP Error: ${e.message}`, undefined, 'email'); }
    }, 10 * MIN);

    // ─── Autopilot — every 30 minutes ────────────────────────────────────────
    setInterval(async () => {
        try {
            const { runAutopilot } = require('./autopilot');
            const enabledUsers = db.prepare(
                'SELECT user_id FROM autopilot_config WHERE enabled = 1'
            ).all() as { user_id: number }[];
            for (const { user_id } of enabledUsers) {
                try { await runAutopilot(user_id); }
                catch (e: any) { logger.error(`Autopilot error for user ${user_id}: ${e.message}`, undefined, 'system'); }
            }
        } catch (e: any) { logger.error(`Cron Autopilot Error: ${e.message}`, undefined, 'system'); }
    }, 30 * MIN);

    // ─── Reply checker — every 5 minutes ─────────────────────────────────────
    setInterval(async () => {
        try { await checkReplies(); }
        catch (e: any) { logger.error(`Cron Reply Error: ${e.message}`, undefined, 'email'); }
    }, 5 * MIN);

    // ─── Rolling daily limit reset — every 5 minutes ─────────────────────────
    setInterval(() => {
        try { checkAndResetDailyLimits(); }
        catch (e: any) { logger.error(`Cron Rolling Reset Error: ${e.message}`, undefined, 'system'); }
    }, 5 * MIN);

    // ─── WAL checkpoint + cache stats — every 6 hours ────────────────────────
    setInterval(() => {
        try {
            walCheckpoint();
            logger.info(`WAL checkpoint done. Cache: ${cache.size()} entries`, undefined, 'db');
        } catch (e: any) {
            logger.warn(`WAL checkpoint failed: ${e.message}`, undefined, 'db');
        }
    }, 6 * 60 * MIN);

    // ─── Log pruning — keep last 10,000 log entries ───────────────────────────
    setInterval(() => {
        try {
            db.prepare(`
                DELETE FROM system_logs
                WHERE id NOT IN (
                    SELECT id FROM system_logs ORDER BY id DESC LIMIT 10000
                )
            `).run();
        } catch { }
    }, 24 * 60 * MIN);

    logger.info('All cron jobs started ✅');
}

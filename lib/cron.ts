import cron from 'node-cron';
import { processQueue, checkReplies, checkAndResetDailyLimits } from './gmail';
import { processWarmupQueue } from './warmupEngine';
import { pollAllInboxes } from './imapMonitor';
import { log } from './logging';
import { initQueueWorker } from './queue';
import db from './db';

export function startCronJobs() {
    // Prevent multiple instantiations in dev mode
    if ((global as any).cronStarted) return;
    (global as any).cronStarted = true;

    log('info', 'Starting all cron jobs...');

    // Run the rolling reset immediately on startup
    try {
        checkAndResetDailyLimits();
    } catch (e: any) {
        log('error', `Startup Reset Error: ${e.message}`);
    }

    // BullMQ Worker — initialise lazily (connects to Redis only when available)
    initQueueWorker().catch(() => { });

    // Process cold email queue every 2 minutes
    cron.schedule('*/2 * * * *', async () => {
        try {
            await processQueue();
        } catch (e: any) {
            log('error', `Cron Queue Error: ${e.message}`);
        }
    }, { runOnInit: false } as any);

    // Run warmup engine every 15 minutes — per-account time windows checked inside engine
    cron.schedule('*/15 * * * *', async () => {
        try {
            const result = await processWarmupQueue();
            if (result.processed > 0 || result.errors > 0) {
                log('info', `Cron Warmup: ${result.processed} sent, ${result.errors} errors`);
            }
        } catch (e: any) {
            log('error', `Cron Warmup Error: ${e.message}`);
        }
    });

    // Poll IMAP inboxes every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
        try {
            const result = await pollAllInboxes();
            if (result.totalReplies > 0 || result.totalBounces > 0) {
                log('info', `Cron IMAP: ${result.totalReplies} replies, ${result.totalBounces} bounces`);
            }
        } catch (e: any) {
            log('error', `Cron IMAP Error: ${e.message}`);
        }
    });

    // Run autopilot check every 30 minutes for all enabled users
    cron.schedule('*/30 * * * *', async () => {
        try {
            // Dynamically import to avoid circular deps
            const { runAutopilot } = require('./autopilot');
            const enabledUsers = db.prepare(`
                SELECT user_id FROM autopilot_config WHERE enabled = 1
            `).all() as { user_id: number }[];

            for (const { user_id } of enabledUsers) {
                try {
                    await runAutopilot(user_id);
                } catch (e: any) {
                    log('error', `Autopilot error for user ${user_id}: ${e.message}`);
                }
            }
        } catch (e: any) {
            log('error', `Cron Autopilot Error: ${e.message}`);
        }
    });

    // Check legacy replies every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            await checkReplies();
        } catch (e: any) {
            log('error', `Cron Reply Error: ${e.message}`);
        }
    });

    // Check for 24-hour rolling daily limits every 5 minutes
    cron.schedule('*/5 * * * *', () => {
        try {
            checkAndResetDailyLimits();
        } catch (e: any) {
            log('error', `Cron Rolling Reset Error: ${e.message}`);
        }
    });

    log('info', 'All cron jobs started ✅');
}

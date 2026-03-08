export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { initDb } = await import('./lib/db');
        initDb();

        // Only start cron in server process
        const { startCronJobs } = await import('./lib/cron');
        startCronJobs();
    }
}

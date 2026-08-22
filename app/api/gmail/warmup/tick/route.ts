import { NextResponse } from 'next/server';
import { processWarmupQueue } from '@/lib/warmupEngine';
import { log } from '@/lib/logging';

export async function POST(req: Request) {
    try {
        log('info', 'Warmup tick triggered');
        const result = await processWarmupQueue();
        return NextResponse.json({
            success: true,
            processed: result.processed,
            errors: result.errors,
        });
    } catch (e: any) {
        log('error', 'Warmup tick failed', e.message);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

// Also support GET for easy cron integration
export async function GET() {
    try {
        const result = await processWarmupQueue();
        return NextResponse.json({
            success: true,
            processed: result.processed,
            errors: result.errors,
        });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

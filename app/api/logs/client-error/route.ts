import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/logs/client-error
 * Receives client-side error reports from error.tsx boundaries.
 * No auth required — errors can happen on any page including login.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, digest, url, timestamp } = body as {
      message?: string;
      digest?: string;
      url?: string;
      timestamp?: string;
    };

    logger.error('[CLIENT ERROR]', { message, digest, url, timestamp }, 'system');

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

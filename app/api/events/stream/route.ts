import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { eventBus } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const user = await requireAuth();

        const stream = new ReadableStream({
            start(controller) {
                // Keep connection alive
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

                const handleEvent = (data: any) => {
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                const channelName = `live:${user.id}`;
                eventBus.on(channelName, handleEvent);

                req.signal.addEventListener('abort', () => {
                    eventBus.off(channelName, handleEvent);
                    controller.close();
                });
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
            },
        });
    } catch (e) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
}


import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { eventBus } from '@/lib/events';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    if (id) {
        // Only update if not already opened to avoid duplicates? Or log every open?
        // Logging every open is fine for analytics but basic logic works
        try {
            // Update Lead state
            db.prepare("UPDATE leads SET opened = 1, temperature = 'Warm', opened_at = ? WHERE id = ?").run(Date.now(), id);

            // Fetch lead to get user_id for event
            const lead = db.prepare('SELECT user_id, email FROM leads WHERE id = ?').get(id) as any;

            if (lead) {
                // Log event
                db.prepare('INSERT INTO email_logs (user_id, lead_id, type) VALUES (?, ?, "opened")')
                    .run(lead.user_id, id);

                try { eventBus.emitEvent('EMAIL_OPENED', lead.user_id, { email: lead.email }); } catch (e) { }
            }

        } catch (e) {
            console.error('Tracking error:', e);
        }
    }

    // 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

    return new NextResponse(pixel, {
        status: 200,
        headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        }
    });
}

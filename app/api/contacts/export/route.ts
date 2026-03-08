import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';
import { log } from '@/lib/logging';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const user = await requireAuth();

        const contacts = db.prepare('SELECT * FROM enriched_contacts WHERE user_id = ? ORDER BY id DESC').all(user.id) as any[];

        if (contacts.length === 0) {
            return new NextResponse('No contacts to export', { status: 404 });
        }

        const headers = ["ID", "Source", "Name", "Email", "Phone", "Current Role", "Company", "LinkedIn URL", "Confidence", "Status", "Date"].join(",");
        const rows = contacts.map(c => [
            c.id,
            `"${c.source || ''}"`,
            `"${c.name || ''}"`,
            `"${c.email || ''}"`,
            `"${c.phone || ''}"`,
            `"${c.current_role || ''}"`,
            `"${c.company || ''}"`,
            `"${c.linkedin_url || ''}"`,
            c.confidence_score,
            `"${c.validation_status || ''}"`,
            `"${c.created_at || ''}"`
        ].join(","));

        const csvContent = [headers, ...rows].join("\n");

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="enriched_contacts.csv"',
            },
        });
    } catch (error: any) {
        log('error', `Failed exporting contacts: ${error.message}`);
        return new NextResponse(error.message, { status: 500 });
    }
}

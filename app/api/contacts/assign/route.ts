import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';
import { log } from '@/lib/logging';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const user = await requireAuth();
        const { contactIds } = await req.json();

        if (!Array.isArray(contactIds) || contactIds.length === 0) {
            return NextResponse.json({ error: 'Contact IDs required' }, { status: 400 });
        }

        const placeholders = contactIds.map(() => '?').join(',');
        const queryParams = [user.id, ...contactIds];

        const query = `SELECT * FROM enriched_contacts WHERE user_id = ? AND id IN (${placeholders})`;
        const contactsToAssign = db.prepare(query).all(queryParams) as any[];

        if (contactsToAssign.length === 0) {
            return NextResponse.json({ error: 'No matching contacts found' }, { status: 404 });
        }

        let assignedCount = 0;
        let duplicateCount = 0;

        for (const contact of contactsToAssign) {
            try {
                // Ensure no duplicate leads
                const existing = db.prepare('SELECT id FROM leads WHERE user_id = ? AND email = ?').get(user.id, contact.email);

                if (existing) {
                    duplicateCount++;

                    // Optionally update the confidence score or company profile for existing lead
                    db.prepare('UPDATE leads SET company_domain = ?, temperature = ? WHERE id = ?')
                        .run(contact.company, contact.confidence_score > 80 ? 'Warm' : 'Cold', (existing as any).id);

                    continue;
                }

                db.prepare(`
                    INSERT INTO leads (user_id, name, email, company, current_role, intro, status, lead_type, email_score, company_domain, temperature)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    user.id,
                    contact.name,
                    contact.email,
                    contact.company,
                    contact.current_role, // assuming added or using existing cols nicely
                    `Found on ${contact.source}`,
                    'pending',
                    'enriched',
                    contact.confidence_score, // assigning email_score from confidence
                    contact.company, // company_domain
                    contact.confidence_score > 80 ? 'Warm' : 'Cold' // temperature
                );

                assignedCount++;
            } catch (err: any) {
                log('error', `Error inserting lead from contact: ${err.message}`);
                // if UNIQUE constraint error, it's a duplicate.
                duplicateCount++;
            }
        }

        log('success', `Assigned ${assignedCount} enriched contacts. Skipped ${duplicateCount} duplicates.`);

        return NextResponse.json({
            success: true,
            assigned: assignedCount,
            duplicates: duplicateCount
        });

    } catch (error: any) {
        log('error', `Failed assigning contacts: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

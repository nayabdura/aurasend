import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';
import { log } from '@/lib/logging';
import { enrichmentEngine } from '@/lib/enrichmentEngine';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const user = await requireAuth();
        const { url, type } = await req.json();

        if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

        log('info', `Starting enrichment job for ${url} (Type: ${type})`);

        let results = [];
        try {
            results = await enrichmentEngine.enrich(url, type);
        } catch (e: any) {
            log('error', `Enrichment engine error: ${e.message}`);
            return NextResponse.json({ error: 'Failed to crawl or parse data. Please check the URL.' }, { status: 500 });
        }

        if (results.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No contacts could be discovered from this source.',
                debug: { url, type }
            });
        }

        const savedContacts = [];

        for (const c of results) {
            try {
                // Deduplication check
                let existing = null;
                if (c.email) {
                    existing = db.prepare('SELECT id FROM enriched_contacts WHERE user_id = ? AND email = ?').get(user.id, c.email);
                }
                if (!existing && c.linkedin_url) {
                    existing = db.prepare('SELECT id FROM enriched_contacts WHERE user_id = ? AND linkedin_url = ?').get(user.id, c.linkedin_url);
                }

                if (existing) {
                    log('info', `Contact ${c.email || c.name} already exists, skipping insertion.`);
                    continue;
                }

                // Prepare metadata and steps
                const metadataJson = JSON.stringify(c.metadata);
                const stepsJson = JSON.stringify(c.steps);

                const result = db.prepare(`
                    INSERT INTO enriched_contacts (
                        user_id, source, name, email, phone, current_role, company, 
                        linkedin_url, confidence_score, validation_status,
                        email_pattern, source_type, company_domain, enrichment_steps, metadata
                    ) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    user.id,
                    type,
                    c.name || 'Unknown',
                    c.email || '',
                    c.phone || '',
                    c.role || 'Professional',
                    c.company || 'Unknown',
                    c.linkedin_url || '',
                    c.confidence || 0,
                    c.validation || 'UNVERIFIED',
                    c.pattern || '',
                    c.source || type,
                    c.domain || '',
                    stepsJson,
                    metadataJson
                );

                (c as any).id = result.lastInsertRowid;
                savedContacts.push(c);

                log('success', `Enriched and saved contact: ${c.name} (${c.email})`);
            } catch (err: any) {
                console.error("Failed to save enriched contact:", err.message);
            }
        }

        return NextResponse.json({ success: true, contacts: savedContacts });

    } catch (error: any) {
        log('error', `Global Scrape Route Error: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

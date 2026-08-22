import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';
import { detectDomainPattern } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(req.url);
        const domain = searchParams.get('domain');

        if (!domain) return NextResponse.json({ error: 'Domain required' }, { status: 400 });

        // Fetch existing leads for this domain
        const leads = db.prepare('SELECT email FROM leads WHERE company_domain = ? LIMIT 50').all(domain) as { email: string }[];

        if (leads.length < 5) {
            // Check enriched contacts too
            const enriched = db.prepare('SELECT email FROM enriched_contacts WHERE company = ? LIMIT 20').all(domain) as { email: string }[];
            leads.push(...enriched);
        }

        if (leads.length === 0) {
            return NextResponse.json({ pattern: 'unknown', confidence: 0 });
        }

        const pattern = detectDomainPattern(leads.map(l => l.email));

        return NextResponse.json({
            pattern,
            confidence: Math.min(leads.length * 10, 95),
            examples: leads.slice(0, 3).map(l => l.email)
        });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

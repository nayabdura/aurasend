
import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/verification';
import { parse } from 'csv-parse/sync';

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let rows;

    try {
        rows = parse(buffer.toString(), { columns: true, skip_empty_lines: true, trim: true }) as any[];
    } catch (e) {
        return NextResponse.json({ error: 'Invalid CSV format' }, { status: 400 });
    }

    let valid = 0;
    let invalid = 0;
    let skipped = 0; // Existing

    // Process rows
    // To avoid timeouts with large lists in API handler, limit to 20 for sync verification OR process as background task?
    // Request asks for "When CSV is uploaded system must verify".
    // For free local app, blocking is acceptable for < 1000 rows.
    // If > 100, checking MX records for all will take time.
    // Optimization: Do it in chunks or parallel.

    const insertInvalid = db.prepare("INSERT INTO invalid_leads (email, name, reason) VALUES (?, ?, ?)");
    const insertValid = db.prepare(`
    INSERT OR IGNORE INTO leads (name, email, website, company, intro, lead_type, is_valid)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

    // Max 50 for immediate response in this "free plan" version to keep UX snappy
    // Loop but async parallel limit?

    // Real implementation: iterate all.
    for (const row of rows) {
        if (!row.email) continue;

        // Check if checks already exist?
        // 1. Verify
        const { isValid, reason } = await verifyEmail(row.email);

        if (!isValid) {
            insertInvalid.run(row.email, row.name || 'Unknown', reason || 'Check Failed');
            invalid++;
        } else {
            const type = row.lead_type || 'client'; // Default client
            const res = insertValid.run(
                row.name || '',
                row.email,
                row.website || '',
                row.company || '',
                row.intro || '', // Optional manual intro
                type
            );
            if (res.changes > 0) valid++; else skipped++;
        }
    }

    return NextResponse.json({
        success: true,
        summary: { valid, invalid, skipped }
    });
}

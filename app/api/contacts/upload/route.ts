import { NextResponse } from 'next/server';
import { requireAuth, getEffectiveUserId } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/contacts/upload - bulk import contacts from CSV
export async function POST(req: Request) {
    try {
        await requireAuth();
        const userId = await getEffectiveUserId();

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Read file text
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());

        if (lines.length < 2) {
            return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 });
        }

        // Parse header row (case-insensitive)
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));

        const colIndex = (names: string[]): number => {
            for (const n of names) {
                const idx = headers.indexOf(n);
                if (idx !== -1) return idx;
            }
            return -1;
        };

        const emailIdx = colIndex(['email', 'email address', 'e-mail', 'emailaddress']);
        if (emailIdx === -1) {
            return NextResponse.json({
                error: 'CSV must have an "email" column. Found columns: ' + headers.join(', ')
            }, { status: 400 });
        }

        const firstNameIdx = colIndex(['first_name', 'firstname', 'first name', 'fname']);
        const lastNameIdx = colIndex(['last_name', 'lastname', 'last name', 'lname']);
        const companyIdx = colIndex(['company', 'company name', 'organization', 'org']);
        const roleIdx = colIndex(['current_role', 'role', 'job_title', 'job title', 'title', 'position']);

        const insertStmt = db.prepare(`
            INSERT OR IGNORE INTO contacts (user_id, email, first_name, last_name, company, current_role, reply_status)
            VALUES (?, ?, ?, ?, ?, ?, 'none')
        `);

        const checkStmt = db.prepare(`SELECT id FROM contacts WHERE user_id = ? AND email = ?`);

        let added = 0;
        let skipped = 0;
        let invalid = 0;
        const errors: string[] = [];

        // Parse each data row
        const insertMany = db.transaction(() => {
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Handle quoted CSV values
                const cols = parseCSVRow(line);

                const rawEmail = (cols[emailIdx] || '').trim().toLowerCase().replace(/["']/g, '');

                // Validate email format
                if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
                    invalid++;
                    if (errors.length < 5) errors.push(`Row ${i + 1}: invalid email "${rawEmail}"`);
                    continue;
                }

                const firstName = firstNameIdx >= 0 ? (cols[firstNameIdx] || '').trim().replace(/["']/g, '') : '';
                const lastName = lastNameIdx >= 0 ? (cols[lastNameIdx] || '').trim().replace(/["']/g, '') : '';
                const company = companyIdx >= 0 ? (cols[companyIdx] || '').trim().replace(/["']/g, '') : '';
                const role = roleIdx >= 0 ? (cols[roleIdx] || '').trim().replace(/["']/g, '') : '';

                // Check if already exists
                const existing = checkStmt.get(userId, rawEmail);
                if (existing) {
                    skipped++;
                    continue;
                }

                insertStmt.run(userId, rawEmail, firstName, lastName, company, role);
                added++;
            }
        });

        insertMany();

        return NextResponse.json({
            success: true,
            added,
            skipped,
            invalid,
            total: added + skipped + invalid,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (e: any) {
        console.error('[contacts/upload]', e);
        return NextResponse.json({ error: 'An internal error occurred: ' + e.message }, { status: 500 });
    }
}

/** Parses a single CSV row, respecting quoted fields */
function parseCSVRow(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

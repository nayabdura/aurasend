
import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string; // 'client' or 'agency'
        const campaign_id = formData.get('campaign_id') as string;

        const userId = await getUserId();

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const content = buffer.toString('utf-8');

        // Parse CSV/TSV
        const records: any[] = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true,    // handle Excel BOM
            delimiter: [',', '\t', ';'], // Handle commas and tabs (copy/paste from sheets)
        });

        if (records.length === 0) {
            return NextResponse.json({ error: 'Empty CSV — check that the file has a header row and data rows' }, { status: 400 });
        }

        const campaignIdInt = campaign_id ? parseInt(campaign_id) : null;

        // Use manual Check + Insert/Update to avoid SQLite constraint mismatch errors 
        // if the database table was created before the UNIQUE index was added.
        const checkStmt = db.prepare('SELECT id FROM leads WHERE user_id = ? AND email = ?');

        const updateStmt = db.prepare(`
            UPDATE leads SET 
                campaign_id = COALESCE(@campaign_id, campaign_id),
                status = CASE WHEN status IN ('bounced','unsubscribed','invalid') THEN status ELSE 'pending' END,
                is_valid = 1,
                name = CASE WHEN @name != '' THEN @name ELSE name END,
                company = CASE WHEN @company != '' THEN @company ELSE company END,
                current_role = CASE WHEN @current_role != '' THEN @current_role ELSE current_role END
            WHERE id = @id
        `);

        const insertStmt = db.prepare(`
            INSERT INTO leads (user_id, name, email, website, company, intro, lead_type, status, campaign_id, current_role)
            VALUES (@user_id, @name, @email, @website, @company, @intro, @type, 'pending', @campaign_id, @current_role)
        `);

        const insertTransaction = db.transaction((rows: any[]) => {
            let addedCount = 0;

            for (const row of rows) {
                // Support various header capitalizations
                const email = (row.email || row.Email || row.EMAIL || '').trim();
                if (!email || !email.includes('@')) continue;

                const firstName = (row.first_name || row['first_name'] || row['First Name'] || row.firstName || '').trim();
                const lastName = (row.last_name || row['last_name'] || row['Last Name'] || row.lastName || '').trim();
                let name = (row.name || row.Name || row.NAME || '').trim();
                if (!name && (firstName || lastName)) {
                    name = `${firstName} ${lastName}`.trim();
                }
                const company = (row.company || row.Company || row.COMPANY || row['Company Name'] || '').trim();
                const website = (row.website || row.Website || row.WEBSITE || row['Website URL'] || '').trim();
                const currentRole = (row.current_role || row['current_role'] || row['Current Role'] || row.role || row.Role || '').trim();

                let intro = (row.intro || row.Intro || '').trim();
                if (!intro) {
                    if (website) intro = `I checked out ${website}`;
                    else if (company) intro = `I noticed ${company} is doing great work`;
                    else intro = 'I found you online';
                }

                try {
                    const existing = checkStmt.get(userId, email) as any;

                    if (existing) {
                        // Update existing lead
                        updateStmt.run({
                            id: existing.id,
                            campaign_id: campaignIdInt,
                            name,
                            company,
                            current_role: currentRole
                        });
                        addedCount++;
                    } else {
                        // Insert new lead
                        insertStmt.run({
                            user_id: userId,
                            name,
                            email,
                            website,
                            company,
                            intro,
                            type: type || 'client',
                            campaign_id: campaignIdInt,
                            current_role: currentRole
                        });
                        addedCount++;
                    }
                } catch (e: any) {
                    console.error('Row error:', e.message, row);
                }
            }
            return { addedCount, total: rows.length };
        });

        const result = insertTransaction(records);

        return NextResponse.json({ success: true, added: result.addedCount, total: result.total });
    } catch (e: any) {
        console.error('Upload error:', e);
        return NextResponse.json({ error: `Failed to upload: ${e.message}` }, { status: 500 });
    }
}

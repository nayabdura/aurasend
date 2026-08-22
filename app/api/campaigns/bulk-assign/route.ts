import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import db from '@/lib/db';
import { getUserId } from '@/lib/auth';

/** Fisher-Yates shuffle — returns a new shuffled copy */
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export async function POST(req: Request) {
    try {
        let userId: number;
        try {
            userId = await getUserId();
        } catch (authErr: any) {
            if (authErr?.digest?.startsWith('NEXT_REDIRECT')) throw authErr;
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const files = formData.getAll('files').concat(formData.getAll('file')) as File[];
        const template_id = formData.get('template_id') as string; // 'random', 'random_three', or a number ID
        const type = (formData.get('type') as string) || 'client'; // 'client' or 'agency'
        const rotate_template_ids_str = formData.get('rotate_template_ids') as string;
        let rotateTemplateIds: number[] = [];
        if (rotate_template_ids_str) {
            try {
                rotateTemplateIds = JSON.parse(rotate_template_ids_str).map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));
            } catch (e) {
                console.error('Failed to parse rotate template IDs:', e);
            }
        }

        // Per-file template overrides: { "filename.csv": "42", ... }
        const file_templates_str = formData.get('file_templates') as string;
        let fileTemplates: Record<string, number | null> = {};
        if (file_templates_str) {
            try {
                const raw = JSON.parse(file_templates_str) as Record<string, string>;
                for (const [fname, tid] of Object.entries(raw)) {
                    const parsed = parseInt(tid);
                    fileTemplates[fname] = isNaN(parsed) ? null : parsed;
                }
            } catch (e) {
                console.error('Failed to parse file_templates:', e);
            }
        }

        const validFiles = files.filter(f => f && f.name && f.size > 0);

        if (validFiles.length === 0) {
            return NextResponse.json({ error: 'No valid CSV files uploaded' }, { status: 400 });
        }

        // Fetch all active, connected Gmail accounts for the user
        const gmailAccounts = db.prepare("SELECT * FROM gmail_accounts WHERE user_id = ? AND status = 'active' AND is_connected = 1").all(userId) as any[];

        if (gmailAccounts.length === 0) {
            return NextResponse.json({
                error: 'No active Gmail accounts connected. Please connect at least one Gmail account first in the Settings page.'
            }, { status: 400 });
        }

        // Fetch all templates belonging to this user for the "random" template selection
        const templates = db.prepare("SELECT id FROM templates WHERE user_id = ?").all(userId) as { id: number }[];

        // Build a shuffled cycle for 'random' mode so every template is used evenly
        // and NO campaign is left without a template.
        const shuffledTemplateIds: number[] = shuffle(templates.map(t => t.id));
        let randomCycleIndex = 0;

        const results: any[] = [];

        // We process each file. Since we need to read file buffer asynchronously, we'll do this in a loop
        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];

            if (file.size > 10 * 1024 * 1024) {
                results.push({
                    filename: file.name,
                    success: false,
                    error: 'File exceeds maximum 10MB limit.'
                });
                continue;
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const content = buffer.toString('utf-8');

            let records: any[] = [];
            try {
                records = parse(content, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                    bom: true,
                    delimiter: [',', '\t', ';'],
                });
            } catch (parseErr: any) {
                results.push({
                    filename: file.name,
                    success: false,
                    error: `CSV parsing failed: ${parseErr.message}`
                });
                continue;
            }

            if (records.length === 0) {
                results.push({
                    filename: file.name,
                    success: false,
                    error: 'Empty CSV or missing headers.'
                });
                continue;
            }

            // Determine email account using Round Robin
            const account = gmailAccounts[i % gmailAccounts.length];

            // Determine campaign name: [CSV Filename] - [Gmail Address]
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const campaignName = `${baseName} - ${account.email}`;

            // ── Determine template_id (priority order) ──────────────────────
            // 1. Per-file override (set individually in the UI per sheet)
            // 2. Global mode: random_three rotation
            // 3. Global mode: random (cycle, not pure-random, so nothing is skipped)
            // 4. Global mode: specific template ID
            let selectedTemplateId: number | null = null;

            const perFileTemplate = fileTemplates[file.name];
            if (perFileTemplate != null) {
                // Per-file template takes highest priority
                selectedTemplateId = perFileTemplate;
            } else if (template_id === 'random_three' && rotateTemplateIds.length > 0) {
                // Cycle through the 3 rotation templates deterministically
                selectedTemplateId = rotateTemplateIds[i % rotateTemplateIds.length];
            } else if (template_id === 'random') {
                if (shuffledTemplateIds.length > 0) {
                    // Cycle through the shuffled list — guarantees every template is used
                    selectedTemplateId = shuffledTemplateIds[randomCycleIndex % shuffledTemplateIds.length];
                    randomCycleIndex++;
                }
            } else if (template_id) {
                const parsedId = parseInt(template_id);
                if (!isNaN(parsedId)) {
                    selectedTemplateId = parsedId;
                }
            }

            // Run DB operations for this campaign inside a single fast transaction
            try {
                const campaignTransaction = db.transaction((leadsList: any[]) => {
                    // 1. Create Campaign
                    const campRes = db.prepare(`
                        INSERT INTO campaigns 
                        (user_id, name, template_id, status, send_window_start, send_window_end,
                         followup1_delay_hours, followup2_delay_hours, followup_enabled)
                        VALUES (?, ?, ?, 'paused', '09:00', '18:00', 48, 96, 1)
                    `).run(userId, campaignName, selectedTemplateId);

                    const campaignId = campRes.lastInsertRowid;

                    // 2. Associate with the Round Robin Gmail Account
                    db.prepare("INSERT INTO campaign_accounts (campaign_id, gmail_account_id) VALUES (?, ?)").run(campaignId, account.id);

                    // 3. Prepare Lead Statements
                    const checkStmt = db.prepare('SELECT id FROM leads WHERE user_id = ? AND email = ?');
                    
                    const updateStmt = db.prepare(`
                        UPDATE leads SET 
                            campaign_id = COALESCE(@campaign_id, campaign_id),
                            status = 'pending',
                            is_valid = 1,
                            name = CASE WHEN @name != '' THEN @name ELSE name END,
                            company = CASE WHEN @company != '' THEN @company ELSE company END,
                            current_role = CASE WHEN @current_role != '' THEN @current_role ELSE current_role END,
                            niche = CASE WHEN @niche != '' THEN @niche ELSE niche END,
                            previous_work = CASE WHEN @previous_work != '' THEN @previous_work ELSE previous_work END
                        WHERE id = @id
                    `);

                    const insertStmt = db.prepare(`
                        INSERT INTO leads (user_id, name, email, website, company, intro, lead_type, status, campaign_id, current_role, niche, previous_work)
                        VALUES (@user_id, @name, @email, @website, @company, @intro, @type, 'pending', @campaign_id, @current_role, @niche, @previous_work)
                    `);

                    let insertedLeads = 0;
                    let reassignedLeads = 0;

                    for (const row of leadsList) {
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
                        const niche = (row.niche || row.Niche || row.NICHE || row.industry || row.Industry || '').trim();
                        const previousWork = (
                            row.previous_work || row['Previous Work'] || row.prev_work ||
                            row.previous_or_current_work || row['Previous or Current Work'] ||
                            row['Previous Work'] || row['Current Work'] || row.previousWork || ''
                        ).trim();

                        let intro = (row.intro || row.Intro || '').trim();
                        if (!intro) {
                            if (website) intro = `I checked out ${website}`;
                            else if (company) intro = `I noticed ${company} is doing great work`;
                            else intro = 'I found you online';
                        }

                        const existing = checkStmt.get(userId, email) as any;

                        if (existing) {
                            updateStmt.run({
                                id: existing.id,
                                campaign_id: campaignId,
                                name,
                                company,
                                current_role: currentRole,
                                niche,
                                previous_work: previousWork,
                            });
                            reassignedLeads++;
                        } else {
                            insertStmt.run({
                                user_id: userId,
                                name,
                                email,
                                website,
                                company,
                                intro,
                                type: type,
                                campaign_id: campaignId,
                                current_role: currentRole,
                                niche,
                                previous_work: previousWork,
                            });
                            insertedLeads++;
                        }
                    }

                    return { campaignId, insertedLeads, reassignedLeads };
                });

                const txResult = campaignTransaction(records);

                // Look up the actual template name for a cleaner result display
                let templateLabel = 'None (no template assigned)';
                if (selectedTemplateId) {
                    const tmplRow = db.prepare('SELECT name FROM templates WHERE id = ?').get(selectedTemplateId) as any;
                    const tmplName = tmplRow?.name || `ID ${selectedTemplateId}`;
                    if (fileTemplates[file.name] != null) {
                        templateLabel = `📌 Per-sheet: ${tmplName}`;
                    } else if (template_id === 'random_three') {
                        templateLabel = `🔄 Rotation: ${tmplName}`;
                    } else if (template_id === 'random') {
                        templateLabel = `🎲 Random: ${tmplName}`;
                    } else {
                        templateLabel = tmplName;
                    }
                }

                results.push({
                    filename: file.name,
                    success: true,
                    campaignId: txResult.campaignId,
                    campaignName: campaignName,
                    assignedEmail: account.email,
                    leadsCount: txResult.insertedLeads + txResult.reassignedLeads,
                    newLeads: txResult.insertedLeads,
                    reassignedLeads: txResult.reassignedLeads,
                    templateAssigned: templateLabel,
                });

            } catch (txErr: any) {
                results.push({
                    filename: file.name,
                    success: false,
                    error: `Database transaction failed: ${txErr.message}`
                });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        console.error('Bulk assign error:', e);
        return NextResponse.json({ error: `An error occurred: ${e.message}` }, { status: 500 });
    }
}

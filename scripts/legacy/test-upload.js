const fs = require('fs');
const { parse } = require('csv-parse/sync');
const Database = require('better-sqlite3');
const db = new Database('cold-email.db');

const content = fs.readFileSync('test.csv', 'utf-8');

const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    delimiter: [',', '\t', ';'],
});

const userId = 1;
const campaignIdInt = 3;
const type = 'client';

const checkStmt = db.prepare('SELECT id FROM leads WHERE user_id = ? AND email = ?');

const updateStmt = db.prepare(`
    UPDATE leads SET 
        campaign_id = COALESCE(@campaign_id, campaign_id),
        status = CASE WHEN status IN ('bounced','unsubscribed','invalid') THEN status ELSE 'pending' END,
        name = CASE WHEN @name != '' THEN @name ELSE name END,
        company = CASE WHEN @company != '' THEN @company ELSE company END
    WHERE id = @id
`);

const insertStmt = db.prepare(`
    INSERT INTO leads (user_id, name, email, website, company, intro, lead_type, status, campaign_id)
    VALUES (@user_id, @name, @email, @website, @company, @intro, @type, 'pending', @campaign_id)
`);

const insertTransaction = db.transaction((rows) => {
    let addedCount = 0;

    for (const row of rows) {
        const email = (row.email || row.Email || row.EMAIL || '').trim();
        if (!email || !email.includes('@')) continue;

        const name = (row.name || row.Name || row.NAME || row['First Name'] || '').trim();
        const company = (row.company || row.Company || row.COMPANY || row['Company Name'] || '').trim();
        const website = (row.website || row.Website || row.WEBSITE || row['Website URL'] || '').trim();

        let intro = (row.intro || row.Intro || '').trim();
        if (!intro) {
            intro = 'I found you online';
        }

        try {
            const existing = checkStmt.get(userId, email);

            if (existing) {
                updateStmt.run({
                    id: existing.id,
                    campaign_id: campaignIdInt,
                    name,
                    company
                });
                addedCount++;
            } else {
                insertStmt.run({
                    user_id: userId,
                    name,
                    email,
                    website,
                    company,
                    intro,
                    type: type || 'client',
                    campaign_id: campaignIdInt,
                });
                addedCount++;
            }
        } catch (e) {
            console.error('Row error:', e.message, row);
        }
    }
    return { addedCount, total: rows.length };
});

const result = insertTransaction(records);
console.log('SUCCESS:', result);

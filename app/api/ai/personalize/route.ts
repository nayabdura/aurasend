import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import db from '@/lib/db';
import { generatePersonalizedEmail } from '@/lib/gemini';
import { AiPersonalizeSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    let targetLeads: any[] = [];
    const campaignId = body.campaignId ? Number(body.campaignId) : null;
    const leadIds = Array.isArray(body.leadIds) ? body.leadIds.map(Number) : [];
    const customPrompt = body.customPrompt || '';

    if (process.env.DATABASE_URL) {
      if (leadIds.length > 0) {
        targetLeads = await prisma.lead.findMany({
          where: { id: { in: leadIds }, userId: user.id },
        });
      } else if (campaignId) {
        targetLeads = await prisma.lead.findMany({
          where: { campaignId, userId: user.id },
          take: 20,
        });
      }
    } else {
      // Local SQLite fallback
      if (leadIds.length > 0) {
        const placeholders = leadIds.map(() => '?').join(',');
        targetLeads = db.prepare(`SELECT * FROM leads WHERE id IN (${placeholders})`).all(...leadIds);
      } else if (campaignId) {
        targetLeads = db.prepare('SELECT * FROM leads WHERE campaign_id = ? LIMIT 20').all(campaignId);
      } else {
        targetLeads = db.prepare('SELECT * FROM leads WHERE user_id = ? LIMIT 10').all(user.id);
      }
    }

    if (targetLeads.length === 0) {
      return NextResponse.json({ error: 'No leads found to personalize.' }, { status: 404 });
    }

    const batchLeads = targetLeads.slice(0, 10);
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const lead of batchLeads) {
      const res = await generatePersonalizedEmail(user.id, lead, customPrompt);
      if (res.success) {
        successCount++;
        results.push({ leadId: lead.id, status: 'success', data: res.data });

        // Save generated output to DB
        if (!process.env.DATABASE_URL) {
          try {
            db.prepare('UPDATE leads SET notes = ? WHERE id = ?').run(
              JSON.stringify(res.data),
              lead.id
            );
          } catch {}
        }
      } else {
        failCount++;
        results.push({ leadId: lead.id, status: 'failed', error: res.error });
      }
    }

    return NextResponse.json({
      success: true,
      processed: batchLeads.length,
      successCount,
      failCount,
      results,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

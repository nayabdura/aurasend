import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import prisma from './prisma';
import { consumeUsage } from './usage';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const GeminiOutputSchema = z.object({
  subject: z.string().min(1, 'Subject cannot be empty'),
  body: z.string().min(1, 'Body cannot be empty'),
  personalization_points: z.array(z.string()).default([]),
});

export type GeminiOutput = z.infer<typeof GeminiOutputSchema>;

export interface LeadContext {
  id: number;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  company?: string | null;
  website?: string | null;
  currentRole?: string | null;
  role?: string | null;
  title?: string | null;
  niche?: string | null;
  previousWork?: string | null;
  previous_work?: string | null;
  intro?: string | null;
  notes?: string | null;
}

/**
 * Generates 100% unique, hyper-personalized cold email for a lead using Google Gemini AI.
 * Analyzes lead's specific company, role, niche, and pain points.
 */
export async function generatePersonalizedEmail(
  userId: number,
  lead: LeadContext,
  campaignObjective?: string,
  baseTemplate?: { subject?: string; body?: string }
): Promise<{ success: boolean; data?: GeminiOutput; error?: string }> {
  if (!genAI) {
    return { success: false, error: 'GEMINI_API_KEY is not configured on the server.' };
  }

  // Enforce Server-Side Usage Quota
  const allowed = await consumeUsage(userId, 'ai_generations', 1);
  if (!allowed) {
    return {
      success: false,
      error: 'You have reached your monthly AI generations limit on your current plan.',
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const leadName = lead.firstName || lead.first_name || lead.name || lead.email.split('@')[0];
    const leadCompany = lead.company || 'their business';
    const leadRole = lead.currentRole || lead.role || lead.title || 'Decision Maker';
    const leadNiche = lead.niche || 'B2B Growth';
    const leadWork = lead.previousWork || lead.previous_work || lead.notes || lead.intro || 'N/A';

    const systemInstruction = `You are an elite B2B sales copywriter and strategist. 
Your task is to analyze the prospect's profile data inside <LEAD_DATA> and craft a 100% UNIQUE, hyper-personalized, tailored cold email designed to solve their specific business pain points.

CRITICAL INSTRUCTIONS:
1. DO NOT use generic static templates. Every email must be uniquely written for THIS specific person and company.
2. Analyze their role (${leadRole}) and company (${leadCompany}) to identify their likely pain points (e.g. lead gen, scaling, deliverability, customer retention, efficiency).
3. Return ONLY a single valid JSON object with keys "subject", "body", and "personalization_points". No markdown blocks, no code fences.
4. Keep the email body short (60-110 words), conversational, low-friction, and end with a simple, soft call-to-action (e.g. "Open to a 5-min chat this week?").

JSON SCHEMA FORMAT:
{
  "subject": "Unique personalized subject line",
  "body": "Hi ${leadName},\\n\\nPersonalized body paragraph...\\n\\nBest regards,\\n[Your Name]",
  "personalization_points": ["Specific insight about ${leadCompany}"]
}`;

    const leadDataBlock = `<LEAD_DATA>
Name: ${leadName}
Email: ${lead.email}
Company: ${leadCompany}
Title/Role: ${leadRole}
Industry/Niche: ${leadNiche}
Previous Work/Context: ${leadWork}
</LEAD_DATA>`;

    const objectiveText = campaignObjective 
      ? `CAMPAIGN OFFER & INSTRUCTIONS: ${campaignObjective}`
      : `CAMPAIGN OFFER: Offer our specialized growth and automated outreach services to help ${leadCompany} solve lead generation bottlenecks and acquire qualified sales meetings on autopilot.`;

    const fullPrompt = `${systemInstruction}\n\n${objectiveText}\n\n${leadDataBlock}`;

    const result = await model.generateContent(fullPrompt);
    const textResponse = result.response.text().trim();

    const cleanedJson = textResponse
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    const parsedData = JSON.parse(cleanedJson);
    const validatedOutput = GeminiOutputSchema.parse(parsedData);

    if (process.env.DATABASE_URL) {
      try {
        await prisma.personalizedMessage.create({
          data: {
            leadId: lead.id,
            subject: validatedOutput.subject,
            body: validatedOutput.body,
            personalizationPoints: JSON.stringify(validatedOutput.personalization_points),
            status: 'GENERATED',
          },
        });
      } catch (dbErr) {}
    }

    return { success: true, data: validatedOutput };
  } catch (e: any) {
    console.error(`Gemini Personalization Error for lead ${lead.id}:`, e);
    return {
      success: false,
      error: e.message || 'Failed to generate AI personalization.',
    };
  }
}

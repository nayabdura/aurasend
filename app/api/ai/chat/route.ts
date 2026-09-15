import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const SYSTEM_PROMPT = `You are AuraSend AI, an expert AI Assistant embedded inside the AuraSend (ColdMail.os) cold email outreach platform.
Your objective is to help users succeed in cold email marketing, sales prospecting, inbox warmup, email deliverability, and campaign automation.

PLATFORM CAPABILITIES YOU SHOULD REFERENCE:
1. Email Accounts (/gmail): Connect via OAuth or SMTP/App Passwords, manage daily send limits, monitor health scores.
2. Warmup Control (/warmup): Gradually ramp up send limits (P2P warmup) to build domain reputation and bypass spam filters.
3. Campaigns (/campaigns): A/B testing, template rotation, sending windows, automated follow-up sequences.
4. Contacts & Leads (/contacts & /leads): Upload CSVs, verify MX/disposable emails, enrich prospect data.
5. Conversations (/conversations): Unified inbox to view, track, and reply to prospect replies.
6. Email Tracker & Analytics (/tracker & /analytics): Real-time open rates, click rates, reply tracking, bounce logs.
7. AI Autopilot (/autopilot): Autonomous campaign optimization and live lead AI personalization.

GUIDELINES:
- Keep answers concise, actionable, and formatted nicely with markdown bullet points if helpful.
- If asked how to perform a task in AuraSend, guide them directly to the exact page link (e.g. [Email Accounts](/gmail) or [Campaigns](/campaigns)).
- Be friendly, encouraging, professional, and copywriter-savvy.`;

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        const { message } = await req.json();

        if (!message || typeof message !== 'string' || !message.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        if (!genAI) {
            // Intelligent fallback response if GEMINI_API_KEY is not configured in env
            const fallbackReply = getFallbackReply(message.trim(), user?.name || user?.email);
            return NextResponse.json({ success: true, reply: fallbackReply });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `${SYSTEM_PROMPT}\n\nUser Question: ${message.trim()}`;
        const result = await model.generateContent(prompt);
        const replyText = result.response.text().trim();

        return NextResponse.json({ success: true, reply: replyText });

    } catch (error: any) {
        console.error('[AI Chat Route Error]:', error);
        const user = await getCurrentUser().catch(() => null);
        const fallbackReply = getFallbackReply('', user?.name || user?.email);
        return NextResponse.json({
            success: true,
            reply: fallbackReply
        });
    }
}

function getFallbackReply(input: string, userName?: string | null): string {
    const text = input.toLowerCase();
    const name = userName ? userName.split(' ')[0] : 'there';

    if (text.includes('campaign') || text.includes('send')) {
        return `Hi ${name}! To create or manage campaign outreach, head over to the [Campaigns](/campaigns) section. You can upload CSV leads, choose templates, and configure sending delay windows.`;
    }
    if (text.includes('gmail') || text.includes('account') || text.includes('connect')) {
        return `You can connect your sending mailboxes (via Google OAuth or App Password/SMTP) in the [Email Accounts](/gmail) hub. Be sure to check your daily send limits!`;
    }
    if (text.includes('warmup') || text.includes('spam') || text.includes('deliverability')) {
        return `To protect your sender reputation, enable inbox warmup under [Warmup Control](/warmup). This gradually builds IP domain trust so your emails hit the main inbox.`;
    }
    if (text.includes('lead') || text.includes('contact') || text.includes('csv')) {
        return `Manage and verify your email lists in [Contacts](/contacts) or [Leads](/leads). You can also run our automated verification to eliminate invalid or disposable emails.`;
    }

    return `Hi ${name}! I am your AuraSend AI Assistant. I can help you automate campaigns, draft high-converting templates, optimize deliverability, and run AI Autopilot. What would you like to build today?`;
}

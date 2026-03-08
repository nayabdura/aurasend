
import { NextResponse } from 'next/server';
import { checkSpamScore, getSpamRating } from '@/lib/spamChecker';

export async function POST(req: Request) {
    const body = await req.json();

    // Support both { text } and { subject, body } formats
    let subject = body.subject || '';
    let emailBody = body.body || body.text || '';

    if (!subject && !emailBody) {
        return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    // If only text was provided, split into subject line (first line) and body
    if (!subject && emailBody) {
        const lines = emailBody.split('\n');
        subject = lines[0] || 'No subject';
        emailBody = lines.slice(1).join('\n') || emailBody;
    }

    const { score, flags } = checkSpamScore(subject, emailBody);
    const rating = getSpamRating(score);

    // Normalize score to 0-10 scale for the UI
    const normalizedScore = Math.min(10, Math.round(score / 10));

    return NextResponse.json({
        score: normalizedScore,
        raw_score: score,
        triggers: flags,
        flags,
        rating,
        level: rating.level,
    });
}

/**
 * AI Personalization & Analytics Engine
 * 100% Free, Built-in logic (No external LLM APIs required for baseline)
 */

export interface ScoringFactors {
    hasLinkedIn: boolean;
    hasJobTitle: boolean;
    isVerified: boolean;
    hasCompanyDomain: boolean;
    isPersonalEmail: boolean;
}

export function calculateLeadScore(factors: ScoringFactors): number {
    let score = 0;
    if (factors.isVerified) score += 40;
    if (factors.hasLinkedIn) score += 20;
    if (factors.hasJobTitle) score += 15;
    if (factors.hasCompanyDomain) score += 15;
    if (factors.isPersonalEmail) score += 10;
    return Math.min(score, 100);
}

/**
 * Heuristic AI: Pattern Detection
 * Analyzes a list of emails to guess the domain pattern
 */
export function detectDomainPattern(emails: string[]): string {
    if (emails.length === 0) return 'unknown';

    const patterns = {
        'first.last': 0,
        'flast': 0,
        'first': 0,
        'firstl': 0,
    };

    emails.forEach(email => {
        const local = email.split('@')[0].toLowerCase();
        if (local.includes('.')) patterns['first.last']++;
        // This is a simplified heuristic, can be expanded with name comparison
    });

    // Return the most common
    return Object.entries(patterns).reduce((a, b) => a[1] > b[1] ? a : b)[0];
}

/**
 * Semantic Personalization (Fake AI / Heuristic)
 * Creates a "hook" based on lead attributes
 */
export function generatePersonalizationHook(lead: any): string {
    const roles = {
        'founder': "I love the vision you have for {{company}}.",
        'marketing': "I was checking out {{company}}'s recent campaigns and was impressed.",
        'sales': "I noticed your growth at {{company}} - very impressive.",
        'engineer': "The tech stack at {{company}} looks top-tier.",
        'hr': "I saw you're expanding the team at {{company}}.",
    };

    const title = (lead.current_role || lead.title || '').toLowerCase();

    for (const [key, hook] of Object.entries(roles)) {
        if (title.includes(key)) {
            return hook.replace('{{company}}', lead.company || 'your firm');
        }
    }

    return `I came across ${lead.company || 'your company'} recently and wanted to reach out.`;
}

/**
 * Success Probability AI
 * Predicts if a template will work for a lead
 */
export function predictSuccessScore(lead: any, template: any): number {
    let base = 50;

    // Factor: Lead Quality
    if (lead.temperature === 'Warm') base += 10;
    if (lead.email_score > 80) base += 5;

    // Factor: Template Quality
    if (template.subject?.length > 10 && template.subject?.length < 40) base += 10; // short subjects win
    if (template.body?.includes('{{name}}')) base += 10;

    // Negative factors
    if (template.body?.length > 1000) base -= 15; // too long

    return Math.max(0, Math.min(100, base));
}

/**
 * AI Suggestion Engine (Free/Heuristic)
 * Generates email content ideas based on a goal/type
 */
export function suggestTemplateContent(type: string, companyName: string): { subject: string, body: string } {
    const database: Record<string, { subjects: string[], bodies: string[] }> = {
        'outreach': {
            subjects: ["Quick question regarding {{company}}", "Intro: {{name}} x {{company}}", "Thoughts on {{company}}'s growth?"],
            bodies: ["Hi {{name}},\n\nI was checking out {{company}} and noticed you guys are doing some great work. I'd love to learn more about how you handle outreach.\n\nBest,\n[Your Name]"]
        },
        'followup': {
            subjects: ["Still interested?", "Quick bump", "Following up"],
            bodies: ["Hi {{name}},\n\nJust wanted to bump this to the top of your inbox. Let me know if you have a moment to chat about {{company}}.\n\nBest,\n[Your Name]"]
        }
    };

    const entry = database[type] || database['outreach'];
    const subject = entry.subjects[Math.floor(Math.random() * entry.subjects.length)];
    const body = entry.bodies[Math.floor(Math.random() * entry.bodies.length)];

    return {
        subject: subject.replace('{{company}}', companyName || 'your team'),
        body: body.replace('{{company}}', companyName || 'your team')
    };
}



// Enhanced spam checker with comprehensive checks
export function checkSpamScore(subject: string, body: string): { score: number; flags: string[] } {
    let score = 0;
    const flags: string[] = [];

    const subjectLower = subject.toLowerCase();
    const bodyLower = body.toLowerCase();
    const combined = subjectLower + ' ' + bodyLower;

    // CATEGORY 1: High-Risk Spam Trigger Words (20 points each)
    const highRiskWords = [
        'viagra', 'cialis', 'casino', 'lottery', 'winner', 'congratulations',
        'inheritance', 'nigerian prince', 'bank account', 'western union',
        'click here now', 'act now', 'limited time offer', 'expires today'
    ];

    highRiskWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const count = (combined.match(regex) || []).length;
        if (count > 0) {
            score += count * 20;
            flags.push(`🚨 HIGH RISK: "${word}" (${count}x) - Avoid completely`);
        }
    });

    // CATEGORY 2: Medium-Risk Marketing Words (10 points each)
    const mediumRiskWords = [
        'free', 'discount', 'buy now', 'order now', 'call now', 'limited',
        'exclusive', 'act fast', 'hurry', 'urgent', 'guarantee', 'risk-free',
        'instant', 'immediately', 'one time', 'cheap', 'deal', 'bargain'
    ];

    mediumRiskWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const count = (combined.match(regex) || []).length;
        if (count > 0) {
            score += count * 10;
            flags.push(`⚠️ MEDIUM RISK: "${word}" (${count}x) - Use sparingly`);
        }
    });

    // CATEGORY 3: Salesy Language (5 points each)
    const salesyWords = [
        'opportunity', 'amazing', 'incredible', 'earn money', 'make money',
        'work from home', 'no experience', 'guaranteed income', 'double your'
    ];

    salesyWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const count = (combined.match(regex) || []).length;
        if (count > 0) {
            score += count * 5;
            flags.push(`⚡ SALESY: "${word}" (${count}x) - Consider rephrasing`);
        }
    });

    // ALL CAPS CHECK
    const capsWords = subject.split(' ').filter(w => w === w.toUpperCase() && w.length > 2);
    if (capsWords.length > 1 || subject === subject.toUpperCase() && subject.length > 5) {
        score += 25;
        flags.push('🔠 ALL CAPS detected - Use normal capitalization');
    }

    // EXCESSIVE EXCLAMATION MARKS
    const exclamations = (combined.match(/!/g) || []).length;
    if (exclamations > 2) {
        score += exclamations * 5;
        flags.push(`❗ Too many exclamation marks (${exclamations}) - Max 1-2`);
    }

    // EXCESSIVE QUESTION MARKS
    const questions = (combined.match(/\?/g) || []).length;
    if (questions > 2) {
        score += questions * 3;
        flags.push(`❓ Too many question marks (${questions}) - Keep it concise`);
    }

    // URL ANALYSIS
    const urls = (combined.match(/https?:\/\//gi) || []).length;
    if (urls > 2) {
        score += (urls - 2) * 15;
        flags.push(`🔗 Too many URLs (${urls}) - Limit to 1-2 max`);
    }

    // Shortened URLs (bit.ly, tinyurl) - High risk
    if (/bit\.ly|tinyurl|goo\.gl|ow\.ly/i.test(combined)) {
        score += 30;
        flags.push('🔗 Shortened URLs detected - Use full URLs for trust');
    }

    // BODY LENGTH CHECK
    if (body.length < 50) {
        score += 20;
        flags.push(`📏 Body too short (${body.length} chars) - Min 100-150 recommended`);
    }

    if (body.length > 2000) {
        score += 10;
        flags.push(`📏 Body too long (${body.length} chars) - Keep under 500 for cold emails`);
    }

    // PERSONALIZATION CHECK
    const hasPersonalization = /\{\{(name|company|website|intro)\}\}/i.test(body);
    if (!hasPersonalization) {
        score += 15;
        flags.push('👤 No personalization - Add {{name}} or {{company}}');
    }

    // SUBJECT LINE SPECIFIC CHECKS
    if (subject.length > 60) {
        score += 10;
        flags.push(`📧 Subject too long (${subject.length} chars) - Keep under 50`);
    }

    if (subject.length < 10) {
        score += 15;
        flags.push(`📧 Subject too short (${subject.length} chars) - Min 15-20 recommended`);
    }

    // MONEY SYMBOLS
    const moneySymbols = (combined.match(/\$\d+|€\d+|£\d+/g) || []).length;
    if (moneySymbols > 0) {
        score += moneySymbols * 10;
        flags.push(`💰 Money amounts detected (${moneySymbols}x) - Triggers spam filters`);
    }

    // NUMBERS ONLY or TOO MANY NUMBERS
    const numberPercentage = (combined.match(/\d/g) || []).length / combined.length;
    if (numberPercentage > 0.15) {
        score += 15;
        flags.push('🔢 Too many numbers - Looks automated/spammy');
    }

    // SPECIAL CHARACTERS SPAM
    const specialChars = (combined.match(/[★☆✓✔✕✖•◆◇▲▼]/g) || []).length;
    if (specialChars > 5) {
        score += specialChars * 5;
        flags.push(`✨ Excessive special characters (${specialChars}) - Triggers filters`);
    }

    // EXCESSIVE SPACING/NEWLINES
    const excessiveSpaces = (body.match(/\n\n\n+/g) || []).length;
    if (excessiveSpaces > 2) {
        score += 10;
        flags.push('⬜ Excessive blank lines - Clean up formatting');
    }

    // ATTACHMENT REFERENCES WITHOUT ATTACHMENTS
    if (/see attached|attachment|attached file/i.test(body)) {
        score += 15;
        flags.push('📎 References attachment (cold emails shouldn\'t have attachments)');
    }

    // READABILITY: Too complex or too simple
    const avgWordLength = body.split(' ').reduce((sum, w) => sum + w.length, 0) / (body.split(' ').length || 1);
    if (avgWordLength > 7) {
        score += 10;
        flags.push('📖 Complex language - Keep it simple and conversational');
    }

    // HTML/CODE IN PLAIN TEXT
    if (/<[^>]+>/g.test(body) && !/\{\{/.test(body)) {
        score += 20;
        flags.push('💻 HTML tags detected in body - Use plain text');
    }

    return { score, flags };
}

export function getSpamRating(score: number): { level: string; color: string; advice: string; emoji: string } {
    if (score === 0) return {
        level: 'Perfect',
        color: 'green',
        advice: 'Excellent! No spam flags detected. Ready to send.',
        emoji: '✅'
    };
    if (score < 15) return {
        level: 'Excellent',
        color: 'green',
        advice: 'Great email! Very minor issues. Should deliver perfectly.',
        emoji: '🟢'
    };
    if (score < 30) return {
        level: 'Good',
        color: 'blue',
        advice: 'Good email. Minor issues. Should deliver fine with high inbox rate.',
        emoji: '🔵'
    };
    if (score < 50) return {
        level: 'Fair',
        color: 'yellow',
        advice: 'Fair. May trigger some filters. Review and fix flagged items.',
        emoji: '🟡'
    };
    if (score < 70) return {
        level: 'Poor',
        color: 'orange',
        advice: 'High risk. Likely to land in spam. Fix critical issues now.',
        emoji: '🟠'
    };
    return {
        level: 'SPAM',
        color: 'red',
        advice: 'CRITICAL: Will definitely be marked as spam. Complete rewrite required.',
        emoji: '🔴'
    };
}

// Deliverability Score (combines multiple factors)
export function calculateDeliverability(subject: string, body: string, hasValidDomain: boolean, hasDKIM: boolean): number {
    const { score: spamScore } = checkSpamScore(subject, body);

    // Start with 100
    let deliverability = 100;

    // Spam score penalty (0-50 points)
    deliverability -= Math.min(spamScore / 2, 50);

    // Domain validation (20 points)
    if (!hasValidDomain) deliverability -= 20;

    // DKIM/SPF (10 points)
    if (!hasDKIM) deliverability -= 10;

    // Personalization bonus
    if (/\{\{(name|company)\}\}/.test(body)) deliverability += 5;

    return Math.max(0, Math.min(100, deliverability));
}

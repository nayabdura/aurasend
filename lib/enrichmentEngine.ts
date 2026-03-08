import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export interface EnrichmentResult {
    name: string;
    role: string;
    company: string;
    domain: string;
    email: string;
    phone: string;
    linkedin_url: string;
    confidence: number;
    validation: 'MX_VALID' | 'PATTERN_ONLY' | 'UNVERIFIED' | 'INVALID';
    pattern?: string;
    source: 'linkedin' | 'company_crawl' | 'generated';
    steps: string[];
    metadata: any;
}

export class EnrichmentEngine {
    private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

    private headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
    };

    /**
     * Main Entry Point for a URL
     */
    async enrich(url: string, type: 'linkedin' | 'domain'): Promise<EnrichmentResult[]> {
        const steps: string[] = [];
        let results: EnrichmentResult[] = [];

        if (type === 'linkedin') {
            const linkedinData = await this.scrapeLinkedIn(url);
            steps.push('linkedin_extraction');

            if (linkedinData) {
                // If we found a company, try to enrich more from their site
                steps.push(`found_company_${linkedinData.company}`);
                const domain = await this.findCompanyDomain(linkedinData.company);
                if (domain) {
                    steps.push(`domain_discovered_${domain}`);
                    const pattern = await this.detectEmailPattern(domain);
                    if (pattern) steps.push(`pattern_detected_${pattern}`);

                    const { validEmail, validationStatus } = await this.findValidEmail(linkedinData.name, domain, pattern);
                    steps.push(`email_validation_${validationStatus}`);

                    results.push({
                        ...linkedinData,
                        domain,
                        email: validEmail,
                        validation: validationStatus,
                        pattern,
                        source: 'linkedin',
                        steps,
                        metadata: { linkedinData }
                    });
                } else {
                    results.push({
                        ...linkedinData,
                        domain: '',
                        email: '',
                        validation: 'UNVERIFIED',
                        source: 'linkedin',
                        steps,
                        metadata: { linkedinData }
                    });
                }
            } else {
                // Return empty if no valid profile data found to avoid dummy data
                return [];
            }
        } else {
            // Domain scrape
            let domain = '';
            try {
                domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
            } catch (e) {
                domain = url.replace(/https?:\/\//, '').split('/')[0];
            }

            const siteData = await this.crawlWebsite(url);
            steps.push('website_crawl');

            const pattern = await this.detectEmailPattern(domain, siteData.emails);
            if (pattern) steps.push(`pattern_detected_${pattern}`);

            // Discovered employees from site
            if (siteData.employees.length > 0) {
                for (const emp of siteData.employees) {
                    const { validEmail, validationStatus } = await this.findValidEmail(emp.name, domain, pattern);

                    results.push({
                        name: emp.name,
                        role: emp.role,
                        company: domain,
                        domain,
                        email: validEmail,
                        phone: siteData.phones[0] || '',
                        linkedin_url: '',
                        confidence: this.calculateConfidence(validationStatus, !!pattern),
                        validation: validationStatus,
                        pattern,
                        source: 'company_crawl',
                        steps: [...steps, 'employee_discovery', 'email_validation'],
                        metadata: { siteData }
                    });
                }
            } else if (siteData.emails.length > 0) {
                // Just use found emails
                for (const email of siteData.emails) {
                    const validation = await this.validateEmail(email);
                    results.push({
                        name: this.extractNameFromEmail(email),
                        role: 'Team Member',
                        company: domain,
                        domain,
                        email,
                        phone: siteData.phones[0] || '',
                        linkedin_url: '',
                        confidence: 90,
                        validation,
                        source: 'company_crawl',
                        steps: [...steps, 'email_extraction'],
                        metadata: { siteData }
                    });
                }
            } else {
                return []; // Avoid generating dummy domains without any valid extraction
            }
        }

        return results;
    }

    private async scrapeLinkedIn(url: string) {
        const username = url.split('/in/')[1]?.split('/')[0]?.replace(/\/$/, '');
        const target = url; // Focusing on the main URL for now to simplify

        try {
            const res = await fetch(target, {
                headers: {
                    ...this.headers,
                    'User-Agent': this.userAgent,
                },
                next: { revalidate: 3600 }
            });

            const status = res.status;
            if (status === 999 || status === 403 || status === 429) {
                console.log(`LinkedIn Blocked (${status})`);
            } else {
                const html = await res.text();

                // Try to extract from Title Tag: "Dav Sahakyan - Founder - SayNine | LinkedIn"
                const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
                if (titleMatch) {
                    const titleStr = titleMatch[1];
                    if (!titleStr.includes('LinkedIn | Log In')) {
                        const parts = titleStr.split(' - ').map(p => p.trim());
                        const namePart = parts[0];
                        let role = 'Professional';
                        let company = '';

                        if (parts.length > 2) {
                            role = parts[1];
                            company = parts[2].split('|')[0].trim();
                        } else if (parts.length > 1) {
                            role = parts[1].split('|')[0].trim();
                        }

                        if (namePart && !namePart.includes('LinkedIn')) {
                            return {
                                name: namePart,
                                role,
                                company,
                                linkedin_url: url,
                                phone: '',
                                confidence: 75
                            };
                        }
                    }
                }

                // Fallback: Meta description
                const descMatch = html.match(/<meta name="description" content="([^"]+)"/i);
                if (descMatch) {
                    const desc = descMatch[1];
                    const nameInDesc = desc.match(/^View ([^']+)'s profile/i);
                    if (nameInDesc) {
                        const name = nameInDesc[1];
                        let role = 'Professional';
                        let company = '';

                        if (desc.includes(' at ')) {
                            const parts = desc.split(' at ');
                            role = parts[0].replace(/^View .*'s profile on LinkedIn, the world's largest professional community. /i, '').trim();
                            company = parts[1].split('.')[0].trim();
                        }

                        return { name, role, company, linkedin_url: url, phone: '', confidence: 60 };
                    }
                }
            }
        } catch (e) {
            console.error(`LinkedIn scrape attempt failed:`, e);
        }

        // LAST RESORT: Search Engine Snippet Parsing
        try {
            console.log(`Trying search engine discovery for ${url}`);
            const query = encodeURIComponent(`"${url}"`);
            const searchRes = await fetch(`https://duckduckgo.com/html/?q=${query}`, {
                headers: { ...this.headers, 'User-Agent': this.userAgent }
            });
            if (searchRes.ok) {
                const searchHtml = await searchRes.text();
                const snippet = searchHtml.match(/<a class="result__snippet"[^>]*>([^<]+)<\/a>/i)?.[1];
                const title = searchHtml.match(/<a class="result__a"[^>]*>([^<]+)<\/a>/i)?.[1];

                if (title && title.includes('|')) {
                    const parts = title.split('|').map(p => p.trim());
                    return {
                        name: parts[0].replace(' - LinkedIn', ''),
                        role: parts[1] || 'Professional',
                        company: parts[2] || '',
                        linkedin_url: url,
                        phone: '',
                        confidence: 65
                    };
                } else if (snippet && snippet.includes('...')) {
                    const name = title?.split('-')[0]?.trim() || 'Unknown';
                    return { name, role: 'Professional', company: '', linkedin_url: url, phone: '', confidence: 40 };
                }
            }
        } catch (e) {
            console.error('Search engine fallback failed:', e);
        }

        return null;
    }

    private async findCompanyDomain(company: string): Promise<string | null> {
        if (!company || company.toLowerCase() === 'linkedin') return null;

        try {
            // First treat as a domain if it looks like one
            if (company.includes('.') && !company.includes(' ')) {
                return company.toLowerCase();
            }

            // Priority 1: Clearbit Autocomplete
            const suggestion = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(company)}`);
            if (suggestion.ok) {
                const data = await suggestion.json();
                if (data && data.length > 0) return data[0].domain;
            }

            // Priority 2: DNS Heuristic
            const cleanName = company.toLowerCase().replace(/[^a-z0-9]/g, '');
            const extensions = ['.com', '.ai', '.io', '.net', '.co'];
            for (const ext of extensions) {
                try {
                    const domain = cleanName + ext;
                    const mx = await resolveMx(domain).catch(() => []);
                    if (mx && mx.length > 0) return domain;
                } catch (e) { }
            }
        } catch (e) { }
        return null;
    }

    private async crawlWebsite(url: string) {
        const results = {
            emails: [] as string[],
            phones: [] as string[],
            employees: [] as { name: string, role: string }[],
            domain: ''
        };

        try {
            const rootUrl = url.startsWith('http') ? url : `https://${url}`;
            const res = await fetch(rootUrl, { headers: { ...this.headers, 'User-Agent': this.userAgent } });
            const html = await res.text();

            results.emails = Array.from(new Set(html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])).map(e => e.toLowerCase());
            results.phones = Array.from(new Set(html.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || []));

            if (!results.domain) {
                try {
                    const domain = new URL(rootUrl).hostname.replace('www.', '');
                    results.domain = domain;
                } catch (e) { }
            }

            const links = html.match(/href="([^"]+)"/g);
            if (links) {
                const subPages = ['/about', '/team', '/people', '/contact', '/management', '/leadership'];
                for (const sub of subPages) {
                    const pageUrl = rootUrl.endsWith('/') ? `${rootUrl}${sub.slice(1)}` : `${rootUrl}${sub}`;
                    try {
                        const subRes = await fetch(pageUrl, { headers: { ...this.headers, 'User-Agent': this.userAgent } });
                        if (subRes.ok) {
                            const subHtml = await subRes.text();
                            const subEmails = subHtml.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
                            results.emails.push(...subEmails.map(e => e.toLowerCase()));

                            const roles = ['CEO', 'Founder', 'Director', 'Manager', 'President', 'Partner', 'Head', 'VP', 'Owner', 'Principal'];
                            roles.forEach(role => {
                                const regex = new RegExp(`(?:^|>|\\s|")([A-Z][a-z]+(?:\\s[A-Z][a-z]+){1,2})[^<]{0,100}(?:${role})`, 'g');
                                const matches = Array.from(subHtml.matchAll(regex));
                                for (const match of matches) {
                                    const cleanedName = match[1].trim();
                                    if (cleanedName.length > 3 && !roles.includes(cleanedName)) {
                                        results.employees.push({ name: cleanedName, role });
                                    }
                                }
                            });
                        }
                    } catch (e) { }
                }
            }

            if (results.domain && results.employees.length === 0) {
                try {
                    const companyRes = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${results.domain}`);
                    if (companyRes.ok) {
                        const list = await companyRes.json();
                        if (list && list[0]) {
                            results.employees.push({ name: list[0].name.split(' ')[0] || 'Team', role: 'Founder' });
                        }
                    }
                } catch (e) { }
            }

            results.emails = Array.from(new Set(results.emails));
            results.employees = Array.from(new Set(results.employees.map(e => JSON.stringify(e)))).map(e => JSON.parse(e));

        } catch (e) { }
        return results;
    }

    private async detectEmailPattern(domain: string, existingEmails: string[] = []): Promise<string> {
        if (existingEmails.length > 0) {
            const patterns: Record<string, number> = {
                'first.last': 0,
                'first_last': 0,
                'flast': 0,
                'first': 0,
                'firstl': 0
            };
            existingEmails.forEach(email => {
                const local = email.split('@')[0];
                if (local.includes('.')) patterns['first.last']++;
                else if (local.includes('_')) patterns['first_last']++;
                else if (local.length > 10) patterns['flast']++;
                else patterns['first']++;
            });
            // return the highest scoring pattern
            return Object.entries(patterns).reduce((a, b) => a[1] > b[1] ? a : b)[0];
        }
        return 'first.last'; // Default
    }

    private generateEmailPermutations(name: string, domain: string): string[] {
        const parts = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean);
        if (parts.length < 1) return [`info@${domain}`, `contact@${domain}`, `hello@${domain}`];

        const first = parts[0];
        const last = parts[parts.length - 1] || '';

        const emails = [
            `${first}.${last}@${domain}`,
            `${first}_${last}@${domain}`,
            `${first}${last}@${domain}`,
            `${first.charAt(0)}.${last}@${domain}`,
            `${first.charAt(0)}${last}@${domain}`,
            `${first}@${domain}`
        ];

        return Array.from(new Set(emails));
    }

    private generateGenericEmails(domain: string): string[] {
        return [
            `hello@${domain}`,
            `info@${domain}`,
            `support@${domain}`,
            `contact@${domain}`,
            `marketing@${domain}`,
            `sales@${domain}`,
            `admin@${domain}`,
            `seo@${domain}`
        ];
    }

    private async validateEmail(email: string): Promise<EnrichmentResult['validation']> {
        if (!email) return 'INVALID';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'INVALID';

        const domain = email.split('@')[1];
        try {
            const mxRecords = await resolveMx(domain);
            if (mxRecords && mxRecords.length > 0) {
                return 'MX_VALID';
            }
        } catch (e) { }
        return 'PATTERN_ONLY';
    }

    private calculateConfidence(validation: string, hasPattern: boolean) {
        if (validation === 'MX_VALID') return hasPattern ? 95 : 85;
        if (validation === 'PATTERN_ONLY') return 70;
        return 40;
    }

    private extractNameFromEmail(email: string): string {
        const local = email.split('@')[0];
        const genericPrefixes = ['hello', 'info', 'support', 'contact', 'marketing', 'sales', 'admin', 'seo'];
        if (genericPrefixes.includes(local.toLowerCase())) return local.charAt(0).toUpperCase() + local.slice(1);
        if (local.includes('.')) {
            return local.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        }
        if (local.includes('_')) {
            return local.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        }
        return local.charAt(0).toUpperCase() + local.slice(1);
    }

    private async findValidEmail(name: string, domain: string, detectedPattern: string | null): Promise<{ validEmail: string, validationStatus: EnrichmentResult['validation'] }> {
        // First try the detected pattern if any
        if (detectedPattern) {
            const parts = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean);
            if (parts.length > 0) {
                const first = parts[0];
                const last = parts[parts.length - 1] || '';
                let testEmail = '';
                switch (detectedPattern) {
                    case 'first.last': testEmail = `${first}.${last}@${domain}`; break;
                    case 'first_last': testEmail = `${first}_${last}@${domain}`; break;
                    case 'flast': testEmail = `${first.charAt(0)}${last}@${domain}`; break;
                    case 'first': testEmail = `${first}@${domain}`; break;
                    case 'firstl': testEmail = `${first}${last.charAt(0)}@${domain}`; break;
                    default: testEmail = `${first}.${last}@${domain}`; break;
                }
                const val = await this.validateEmail(testEmail);
                if (val === 'MX_VALID') {
                    return { validEmail: testEmail, validationStatus: val };
                }
            }
        }

        // Generate combinations
        const permutations = this.generateEmailPermutations(name, domain);
        for (const testEmail of permutations) {
            const val = await this.validateEmail(testEmail);
            if (val === 'MX_VALID') {
                return { validEmail: testEmail, validationStatus: val };
            }
        }

        // Try generic fallback emails
        const generics = this.generateGenericEmails(domain);
        for (const testEmail of generics) {
            const val = await this.validateEmail(testEmail);
            if (val === 'MX_VALID') {
                return { validEmail: testEmail, validationStatus: val };
            }
        }

        // Default fallback (first generated)
        return { validEmail: permutations[0] || generics[0] || `info@${domain}`, validationStatus: 'UNVERIFIED' };
    }
}

export const enrichmentEngine = new EnrichmentEngine();

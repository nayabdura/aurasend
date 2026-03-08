
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testEmployeeSearch(domain: string) {
    const company = domain.split('.')[0];
    console.log(`Searching for employees at ${company}...`);
    try {
        const query = encodeURIComponent(`site:linkedin.com/in/ "${company}"`);
        const res = await fetch(`https://duckduckgo.com/html/?q=${query}`, {
            headers: { 'User-Agent': userAgent }
        });
        const html = await res.text();

        // Extract names and titles from result snippets
        // DuckDuckGo HTML format: <a class="result__a" href="...">Name - Role - Company</a>
        const matches = Array.from(html.matchAll(/<a class="result__a" [^>]+>([^<]+)<\/a>/gi));
        console.log(`Found ${matches.length} possible profiles:`);

        for (const match of matches) {
            const text = match[1];
            console.log(`- ${text}`);
        }

    } catch (e) {
        console.error('Search Error:', e);
    }
}

testEmployeeSearch('apple.com');

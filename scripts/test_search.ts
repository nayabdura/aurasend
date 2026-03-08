
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testSearch(linkedinUrl: string) {
    console.log(`Searching for info on ${linkedinUrl}...`);
    try {
        const query = encodeURIComponent(`site:linkedin.com/in/ "${linkedinUrl.split('/in/')[1]}"`);
        const res = await fetch(`https://duckduckgo.com/html/?q=${query}`, {
            headers: { 'User-Agent': userAgent }
        });
        const html = await res.text();
        console.log(`HTML Length: ${html.length}`);

        // Extract title and snippet
        const titleMatch = html.match(/<a class="result__a" [^>]+>([^<]+)<\/a>/i);
        const snippetMatch = html.match(/<a class="result__snippet" [^>]+>([^<]+)<\/a>/i);

        console.log('Title:', titleMatch ? titleMatch[1] : 'None');
        console.log('Snippet:', snippetMatch ? snippetMatch[1] : 'None');

    } catch (e) {
        console.error('Search Error:', e);
    }
}

testSearch('https://www.linkedin.com/in/williamhgates/');

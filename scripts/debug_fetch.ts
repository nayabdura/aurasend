
const _debugUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testFetch(url: string) {
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url, { headers: { 'User-Agent': _debugUserAgent } });
        console.log(`Status: ${res.status}`);
        console.log(`Headers:`, Object.fromEntries(res.headers.entries()));
        const text = await res.text();
        console.log(`Content Length: ${text.length}`);
        console.log(`Preview: ${text.substring(0, 500)}`);
    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

testFetch('https://apple.com');

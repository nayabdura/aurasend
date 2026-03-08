
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testScrape(url: string) {
    console.log(`Testing ${url}...`);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        console.log(`Status: ${res.status}`);
        const html = await res.text();
        console.log(`Length: ${html.length}`);

        const nameMatch = html.match(/"name":"([^"]+)"/i) || html.match(/<title>([^<]+)\|/i);
        const titleMatch = html.match(/"headline":"([^"]+)"/i) || html.match(/<meta name="description" content="([^"]+)"/i);

        console.log('Name Match:', nameMatch ? nameMatch[0] : 'None');
        console.log('Title Match:', titleMatch ? titleMatch[0] : 'None');

        if (html.includes('auth_wall') || html.includes('login')) {
            console.log('BLOCKED: Hit LinkedIn Auth Wall');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

testScrape('https://www.linkedin.com/in/williamhgates/');
testScrape('https://www.linkedin.com/in/satyanarayanan/');

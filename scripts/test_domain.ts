
import { enrichmentEngine } from '../lib/enrichmentEngine';

async function test() {
    console.log('Testing Domain Scrape (apple.com)...');
    try {
        const res = await enrichmentEngine.enrich('apple.com', 'domain');
        console.log('Results:', JSON.stringify(res, null, 2));
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

test();

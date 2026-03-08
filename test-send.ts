import { processQueue } from './lib/gmail';

async function testSend() {
    console.log('Starting manual processQueue test...');
    try {
        // processQueue(ignoreStatus, testEmail, userId, ignoreWindow)
        await processQueue(true, undefined, 1, true);
        console.log('processQueue completed.');
    } catch (e: any) {
        console.error('Error during processQueue:', e);
    }
}

testSend();


import net from 'net';
import dns from 'dns/promises';

export interface VerificationResult {
    isValid: boolean;
    score: number;
    status: 'valid' | 'invalid' | 'catch-all' | 'unknown' | 'disabled';
    isRoleAccount: boolean;
    isDisposable: boolean;
    isCatchAll: boolean;
    isFullInbox: boolean;
    mxRecords: string[];
    reason?: string;
    canConnectSmtp: boolean;
    isDeliverable: boolean;
}

const disposableDomains = new Set([
    'mailinator.com', 'temp-mail.org', 'guerrillamail.com', '10minutemail.com',
    'throwawaymail.com', 'yopmail.com', 'maildrop.cc', 'getairmail.com',
    'dispostable.com', 'trashmail.com'
]);

const rolePrefixes = new Set([
    'admin', 'info', 'support', 'sales', 'contact', 'help', 'api', 'billing', 'jobs', 'marketing', 'media', 'office', 'press', 'webmaster'
]);

function validateFormat(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

async function getMxRecords(domain: string): Promise<string[]> {
    try {
        const addresses = await dns.resolveMx(domain);
        return addresses.sort((a, b) => a.priority - b.priority).map(a => a.exchange);
    } catch (e) {
        return [];
    }
}

async function checkSMTP(domain: string, email: string, mxRecords: string[]): Promise<{ canConnect: boolean, isFull: boolean, isDisabled: boolean, isValid: boolean, reason?: string }> {
    if (mxRecords.length === 0) return { canConnect: false, isFull: false, isDisabled: false, isValid: false, reason: 'No MX records' };

    const bestMx = mxRecords[0];

    return new Promise((resolve) => {
        const socket = net.createConnection(25, bestMx);
        let step = 0;
        let isFull = false;
        let isDisabled = false;

        socket.setTimeout(3500, () => {
            socket.destroy();
            resolve({ canConnect: false, isFull: false, isDisabled: false, isValid: false, reason: 'SMTP Timeout' }); // Strict
        });

        socket.on('error', (err) => {
            socket.destroy();
            resolve({ canConnect: false, isFull: false, isDisabled: false, isValid: false, reason: `SMTP Port Blocked/Error` });
        });

        socket.on('data', (data) => {
            const response = data.toString();

            if (response.startsWith('4') || response.startsWith('5')) {
                socket.destroy();

                const responseLower = response.toLowerCase();
                if (responseLower.includes('quota') || responseLower.includes('full')) isFull = true;
                if (responseLower.includes('disabled') || responseLower.includes('inactive')) isDisabled = true;

                // If step is less than 3, it rejected our server/sender/IP, not the mailbox.
                // It means we CAN connect to SMTP but we cannot verify the specific mailbox.
                const reason = isFull ? 'Inbox full' : (isDisabled ? 'Account disabled' : `SMTP Rejected: ${response.substring(0, 40).trim()}`);

                // If it's a 4xx error (like Yahoo returning 421 or 451), it's unknown/greylisted
                if (response.startsWith('4')) {
                    resolve({
                        canConnect: true,
                        isFull,
                        isDisabled,
                        isValid: false, // Do not consider valid. It's grey area or invalid
                        reason: `Greylisted/Deferred (Code 4xx)`
                    });
                    return;
                }

                // If it's a 5xx error, it's a hard reject. If it rejected our MAIL FROM or RCPT TO, it's invalid.
                resolve({
                    canConnect: true,
                    isFull,
                    isDisabled,
                    isValid: false,
                    reason
                });
                return;
            }

            if (step === 0 && response.startsWith('220')) {
                socket.write(`HELO ${domain}\r\n`);
                step++;
            } else if (step === 1 && (response.startsWith('250') || response.startsWith('220'))) {
                socket.write(`MAIL FROM: <no-reply@test.com>\r\n`); // Use generic sender
                step++;
            } else if (step === 2 && response.startsWith('250')) {
                socket.write(`RCPT TO: <${email}>\r\n`);
                step++;
            } else if (step === 3 && (response.startsWith('250') || response.startsWith('251'))) {
                socket.destroy();
                resolve({ canConnect: true, isFull: false, isDisabled: false, isValid: true });
            }
        });
    });
}

export async function verifyEmail(email: string): Promise<VerificationResult> {
    const result: VerificationResult = {
        isValid: false,
        score: 0,
        status: 'unknown',
        isRoleAccount: false,
        isDisposable: false,
        isCatchAll: false, // Hard to detect without catch-all probe (sending to random address)
        isFullInbox: false,
        mxRecords: [],
        canConnectSmtp: false,
        isDeliverable: false
    };

    if (!email || !validateFormat(email)) {
        result.status = 'invalid';
        result.reason = 'Invalid format';
        return result;
    }

    const [user, domain] = email.split('@');

    // 1. Role Account
    if (rolePrefixes.has(user.toLowerCase())) {
        result.isRoleAccount = true;
    }

    // 2. Disposable
    if (disposableDomains.has(domain.toLowerCase())) {
        result.isDisposable = true;
        result.status = 'invalid';
        result.reason = 'Disposable domain';
        result.score = 0;
        return result;
    }

    // 3. MX Records
    const mx = await getMxRecords(domain);
    result.mxRecords = mx;

    if (mx.length === 0) {
        result.status = 'invalid';
        result.reason = 'No MX records';
        result.score = 10;
        return result;
    }

    // 4. SMTP Check
    const smtp = await checkSMTP(domain, email, mx);
    result.canConnectSmtp = smtp.canConnect;
    result.isFullInbox = smtp.isFull;

    if (smtp.isDisabled) {
        result.status = 'invalid';
        result.isValid = false;
        result.isDeliverable = false;
        result.score = 2; // Very strict invalid score
        result.reason = 'This email address does not exist or the mailbox is permanently unavailable. Do not send.';
        return result;
    }

    if (smtp.isFull) {
        result.status = 'invalid';
        result.isValid = false;
        result.isDeliverable = false;
        result.score = 20;
        result.reason = 'Inbox full. Delivery will bounce.';
        return result;
    }

    if (!smtp.isValid) {
        // Did the SMTP connection completely fail because it's unreachable/blocked port, or did they reject us?
        if (!smtp.canConnect) {
            result.status = 'unknown'; // Cannot verify SMTP confidently over localhost port blocks
            result.isValid = false;
            result.score = 40;
            result.reason = 'Cannot connect to SMTP server. Verify port 25 is unblocked.';
            return result;
        }

        // They rejected us or greylisted us
        if (smtp.reason?.includes('Greylisted/Deferred')) {
            result.status = 'unknown';
            result.isValid = false;
            result.score = 40;
            result.reason = 'SMTP Server deferred connection. Please try again later.';
            return result;
        }

        result.status = 'invalid';
        result.isValid = false;
        result.score = 2; // Strict score for invalid
        result.reason = 'This email address does not exist or the mailbox is permanently unavailable. Do not send.';
        return result;
    }

    // Passed SMTP check
    result.isValid = true;
    result.isDeliverable = true;
    result.status = 'valid';
    result.reason = 'Success/Valid';
    result.score = result.isRoleAccount ? 80 : 95;

    return result;
}

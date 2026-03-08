
import db from './db';

// Logger
export function log(level: 'info' | 'error' | 'success' | 'warn', message: string, details?: any) {
    try {
        const detailStr = details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : null;

        db.prepare("INSERT INTO system_logs (level, message, details) VALUES (?, ?, ?)")
            .run(level, message, detailStr);

        if (level === 'error') {
            if (details !== undefined && details !== null) console.error(`[LOG] ${message}`, details);
            else console.error(`[LOG] ${message}`);
        } else {
            if (details !== undefined && details !== null) console.log(`[LOG] ${message}`, details);
            else console.log(`[LOG] ${message}`);
        }
    } catch (e) {
        console.error('Failed to write log to DB:', e);
    }
}

export function getLogs(limit = 20) {
    return db.prepare("SELECT * FROM system_logs ORDER BY id DESC LIMIT ?").all(limit);
}

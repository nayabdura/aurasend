import 'server-only';
import { EventEmitter } from 'events';
import db from './db';
import { log } from './logging';

class SystemEventBus extends EventEmitter {
    constructor() {
        super();

        // Listen to all events to log them to DB
        this.on('event', this.handleEvent.bind(this));
    }

    private handleEvent(payload: { type: string; userId: number; details?: any }) {
        const { type, userId, details } = payload;

        try {
            db.prepare(`
                INSERT INTO system_events (user_id, type, details)
                VALUES (?, ?, ?)
            `).run(userId, type, details ? JSON.stringify(details) : null);
        } catch (e: any) {
            log('error', `Failed to record system event ${type} for user ${userId}`, e.message);
        }
    }

    emitEvent(type: string, userId: number, details?: any) {
        // Emit to the explicit 'event' channel for db recording
        this.emit('event', { type, userId, details });

        // Emit to the dynamic type channel for live listeners
        this.emit(`live:${userId}`, { type, userId, details, timestamp: Date.now() });
    }
}

// Global instance to prevent multiple event buses during dev hot-reloads
const globalEventBus = (global as any).eventBus || new SystemEventBus();
if (process.env.NODE_ENV !== 'production') {
    (global as any).eventBus = globalEventBus;
}

export const eventBus = globalEventBus;

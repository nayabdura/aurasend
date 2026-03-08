import { cookies } from 'next/headers';
import db from './db';
import bcrypt from 'bcrypt';
import { redirect } from 'next/navigation';

export interface User {
    id: number;
    email: string;
    name: string | null;
    role: 'master' | 'admin' | 'user';
    workspace_id: number;
    two_factor_enabled: number;
    is_verified?: number;
}

export interface SessionData {
    userId: number;
    email: string;
    role: 'master' | 'admin' | 'user';
    workspaceId: number;
    ip?: string;
}

// ─── Simple Session Cookies (No JWT to allow peaceful testing) ───────────

export async function createToken(data: SessionData): Promise<string> {
    // Encodes the session into a simple Base64 string so it never expires during testing
    return Buffer.from(JSON.stringify(data)).toString('base64');
}

export async function verifyToken(token: string): Promise<SessionData | null> {
    try {
        const parsed = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        return {
            userId: Number(parsed.userId),
            email: String(parsed.email),
            role: parsed.role,
            workspaceId: Number(parsed.workspaceId),
            ip: parsed.ip
        };
    } catch (e) {
        return null; // Invalid or tampered cookie
    }
}

// ─────────────────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<User | null> {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) return null;

        const session = await verifyToken(token);
        if (!session) return null;

        const user = db.prepare('SELECT id, email, name, role, workspace_id, two_factor_enabled FROM users WHERE id = ?').get(session.userId) as User;
        return user || null;
    } catch (e) {
        return null;
    }
}

export async function requireAuth(): Promise<User> {
    const user = await getCurrentUser();
    if (!user) redirect('/login');
    return user;
}

export async function requireMaster(): Promise<User> {
    const user = await requireAuth();
    if (user.role !== 'master') redirect('/login');
    return user;
}

export async function loginUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;

    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    const session: SessionData = {
        userId: user.id,
        email: user.email,
        role: user.role,
        workspaceId: user.workspace_id || 1
    };

    const token = await createToken(session);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            workspace_id: user.workspace_id,
            two_factor_enabled: user.two_factor_enabled,
            is_verified: user.is_verified
        },
        token
    };
}

export async function registerUser(email: string, password: string, name?: string): Promise<User> {
    const hash = await bcrypt.hash(password, 10);

    const result = db.prepare(
        'INSERT INTO users (email, password_hash, name, role, workspace_id) VALUES (?, ?, ?, ?, ?)'
    ).run(email, hash, name || null, 'user', 1);

    const user = db.prepare('SELECT id, email, name, role, workspace_id, two_factor_enabled FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
    return user;
}

export async function logoutUser() {
    const cookieStore = cookies();
    cookieStore.delete('auth_token');
    cookieStore.delete('session'); // Clear old jwt tokens if any exist
}

export function getUserById(userId: number): User | null {
    return db.prepare('SELECT id, email, name, role, workspace_id, two_factor_enabled FROM users WHERE id = ?').get(userId) as User | null;
}

export async function getUserId(): Promise<number> {
    const user = await requireAuth();
    return user.id;
}

export async function getEffectiveUserId(): Promise<number | null> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    return user.role === 'master' ? null : user.id;
}

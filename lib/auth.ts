import { cookies } from 'next/headers';
import prisma from './prisma';
import db from './db';
import bcrypt from 'bcrypt';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';

export interface User {
    id: number;
    email: string;
    name: string | null;
    role: 'MASTER' | 'ADMIN' | 'USER' | 'master' | 'admin' | 'user';
    workspace_id: number;
    two_factor_enabled: number;
    is_verified?: number;
}

export interface SessionData {
    userId: number;
    email: string;
    role: 'MASTER' | 'ADMIN' | 'USER' | 'master' | 'admin' | 'user';
    workspaceId: number;
    ip?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_super_secret_key_change_in_production!';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export async function createToken(data: SessionData): Promise<string> {
    const token = await new SignJWT({ 
            userId: data.userId, 
            email: data.email, 
            role: data.role, 
            workspaceId: data.workspaceId, 
            ip: data.ip 
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedSecret);
        
    return token;
}

export async function verifyToken(token: string): Promise<SessionData | null> {
    try {
        const { payload } = await jwtVerify(token, encodedSecret);
        return {
            userId: Number(payload.userId),
            email: String(payload.email),
            role: (String(payload.role || 'USER').toUpperCase() as SessionData['role']),
            workspaceId: Number(payload.workspaceId || 1),
            ip: payload.ip as string | undefined
        };
    } catch (e) {
        return null;
    }
}

export async function getCurrentUser(): Promise<User | null> {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) return null;

        const session = await verifyToken(token);
        if (!session) return null;

        if (!process.env.DATABASE_URL) {
            const user = db.prepare('SELECT id, email, name, role, workspace_id, two_factor_enabled, is_verified FROM users WHERE id = ?').get(session.userId) as User;
            return user || null;
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                workspaceId: true,
                twoFactorEnabled: true,
                isVerified: true,
            },
        });

        if (!dbUser) return null;

        return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            workspace_id: dbUser.workspaceId || 1,
            two_factor_enabled: dbUser.twoFactorEnabled ? 1 : 0,
            is_verified: dbUser.isVerified ? 1 : 0,
        };
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
    const roleStr = String(user.role).toUpperCase();
    if (roleStr !== 'MASTER' && roleStr !== 'ADMIN') redirect('/login');
    return user;
}

/**
 * IDOR Protection Helper: Verifies user owns resource or is a Master admin
 */
export async function verifyResourceOwnership(
    userId: number,
    modelName: 'lead' | 'campaign' | 'gmailAccount' | 'template' | 'contact',
    resourceId: number
): Promise<boolean> {
    if (!process.env.DATABASE_URL) return true;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return false;
        if (user.role === 'MASTER') return true;

        const resource = await (prisma as any)[modelName].findUnique({
            where: { id: resourceId },
            select: { userId: true },
        });

        return resource && resource.userId === userId;
    } catch (e) {
        return false;
    }
}

export async function loginUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
    if (!process.env.DATABASE_URL) {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return null;

        try {
            db.prepare("UPDATE users SET last_login = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = ?").run(user.id);
        } catch {}

        const session: SessionData = {
            userId: user.id,
            email: user.email,
            role: user.role,
            workspaceId: user.workspace_id || 1,
        };

        const token = await createToken(session);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                workspace_id: user.workspace_id || 1,
                two_factor_enabled: user.two_factor_enabled || 0,
                is_verified: user.is_verified ?? 1,
            },
            token,
        };
    }

    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) return null;

    const isValid = await bcrypt.compare(password, dbUser.passwordHash);
    if (!isValid) return null;

    await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastLogin: new Date() },
    });

    const session: SessionData = {
        userId: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        workspaceId: dbUser.workspaceId || 1,
    };

    const token = await createToken(session);

    return {
        user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            workspace_id: dbUser.workspaceId || 1,
            two_factor_enabled: dbUser.twoFactorEnabled ? 1 : 0,
            is_verified: dbUser.isVerified ? 1 : 0,
        },
        token,
    };
}

export async function registerUser(email: string, password: string, name?: string): Promise<User> {
    const hash = await bcrypt.hash(password, 10);

    if (!process.env.DATABASE_URL) {
        const result = db.prepare(
            'INSERT INTO users (email, password_hash, name, role, workspace_id, is_verified) VALUES (?, ?, ?, ?, ?, 1)'
        ).run(email, hash, name || null, 'user', 1);

        const user = db.prepare('SELECT id, email, name, role, workspace_id, two_factor_enabled, is_verified FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
        return user;
    }

    const dbUser = await prisma.user.create({
        data: {
            email,
            passwordHash: hash,
            name: name || null,
            role: 'USER',
            workspaceId: 1,
            isVerified: true,
        },
    });

    return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        workspace_id: dbUser.workspaceId || 1,
        two_factor_enabled: 0,
        is_verified: 1,
    };
}

export async function logoutUser() {
    const cookieStore = cookies();
    cookieStore.delete('auth_token');
    cookieStore.delete('session');
}

export function getUserById(userId: number) {
    if (!process.env.DATABASE_URL) {
        return db.prepare('SELECT id, email, name, role, workspace_id, two_factor_enabled FROM users WHERE id = ?').get(userId) as any;
    }
    return prisma.user.findUnique({ where: { id: userId } });
}

export async function getUserId(): Promise<number> {
    const user = await requireAuth();
    return user.id;
}

export async function getEffectiveUserId(): Promise<number | null> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    return String(user.role).toUpperCase() === 'MASTER' ? null : user.id;
}

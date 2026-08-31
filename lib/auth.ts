import 'server-only';
import { redirect } from 'next/navigation';
import AuthService, { SessionData } from '../backend/auth';
import UserService from '../backend/services/UserService';
import SecurityService from '../backend/security';
import UserRepository from '../backend/repositories/UserRepository';

export interface User {
    id: number;
    email: string;
    name: string | null;
    role: 'MASTER' | 'ADMIN' | 'USER' | 'master' | 'admin' | 'user';
    workspace_id: number;
    two_factor_enabled: number;
    is_verified?: number;
}

export type { SessionData };

export async function createToken(data: SessionData): Promise<string> {
    return AuthService.createToken(data);
}

export async function verifyToken(token: string): Promise<SessionData | null> {
    return AuthService.verifyToken(token);
}

export async function getCurrentUser(): Promise<User | null> {
    const dbUser = await AuthService.getCurrentUser();
    if (!dbUser) return null;

    return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role as User['role'],
        workspace_id: dbUser.workspaceId || 1,
        two_factor_enabled: dbUser.twoFactorEnabled ? 1 : 0,
        is_verified: dbUser.isVerified ? 1 : 0,
    };
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

export async function verifyResourceOwnership(
    userId: number,
    modelName: 'lead' | 'campaign' | 'gmailAccount' | 'template' | 'contact',
    resourceId: number
): Promise<boolean> {
    return SecurityService.verifyResourceOwnership(userId, modelName, resourceId);
}

export async function loginUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const result = await UserService.login(email, password);
    if (!result) return null;

    return {
        user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role as User['role'],
            workspace_id: result.user.workspaceId || 1,
            two_factor_enabled: result.user.twoFactorEnabled ? 1 : 0,
            is_verified: result.user.isVerified ? 1 : 0,
        },
        token: result.token,
    };
}

export async function registerUser(email: string, password: string, name?: string): Promise<User> {
    const dbUser = await UserService.register(email, password, name);

    return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role as User['role'],
        workspace_id: dbUser.workspaceId || 1,
        two_factor_enabled: 0,
        is_verified: 1,
    };
}

export async function logoutUser() {
    await AuthService.clearAuthCookie();
}

export async function getUserById(userId: number) {
    return UserRepository.findById(userId);
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

import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcrypt';
import config from '../config';
import UserRepository from '../repositories/UserRepository';
import { User } from '@prisma/client';

export interface SessionData {
  userId: number;
  email: string;
  role: 'MASTER' | 'ADMIN' | 'USER' | 'master' | 'admin' | 'user';
  workspaceId: number;
  ip?: string;
  exp?: number;
  iat?: number;
}

const encodedSecret = new TextEncoder().encode(config.jwt.secret);

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async createToken(data: SessionData): Promise<string> {
    return new SignJWT({
      userId: data.userId,
      email: data.email,
      role: data.role,
      workspaceId: data.workspaceId,
      ip: data.ip,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(config.jwt.expiresIn)
      .sign(encodedSecret);
  }

  static async verifyToken(token: string): Promise<SessionData | null> {
    try {
      const { payload } = await jwtVerify(token, encodedSecret);
      return {
        userId: Number(payload.userId),
        email: String(payload.email),
        role: (String(payload.role || 'USER').toUpperCase() as SessionData['role']),
        workspaceId: Number(payload.workspaceId || 1),
        ip: payload.ip as string | undefined,
        exp: payload.exp,
        iat: payload.iat,
      };
    } catch {
      return null;
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const cookieStore = cookies();
      const token = cookieStore.get(config.jwt.cookieName)?.value;
      if (!token) return null;

      const session = await AuthService.verifyToken(token);
      if (!session) return null;

      return UserRepository.findById(session.userId);
    } catch {
      return null;
    }
  }

  static async setAuthCookie(token: string) {
    const cookieStore = cookies();
    cookieStore.set(config.jwt.cookieName, token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  static async clearAuthCookie() {
    const cookieStore = cookies();
    cookieStore.delete(config.jwt.cookieName);
    cookieStore.delete('session');
  }
}

export default AuthService;

import 'server-only';
import UserRepository from '../repositories/UserRepository';
import AuthService from '../auth';
import { User } from '@prisma/client';

export class UserService {
  static async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const user = await UserRepository.findByEmail(email);
    if (!user) return null;

    const isValid = await AuthService.verifyPassword(password, user.passwordHash);
    if (!isValid) return null;

    await UserRepository.updateLastLogin(user.id);

    const token = await AuthService.createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId || 1,
    });

    return { user, token };
  }

  static async register(email: string, password: string, name?: string): Promise<User> {
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new Error('Email is already registered');
    }

    const passwordHash = await AuthService.hashPassword(password);
    return UserRepository.create({
      email,
      passwordHash,
      name,
      role: 'USER',
      workspaceId: 1,
      isVerified: true,
    });
  }

  static async getUserProfile(userId: number): Promise<User | null> {
    return UserRepository.findById(userId);
  }
}

export default UserService;

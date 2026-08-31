import 'server-only';
import prisma from '../database/prisma';
import { User, Role, PlanStatus } from '@prisma/client';

export class UserRepository {
  static async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  static async findByStripeCustomerId(customerId: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
  }

  static async create(data: {
    email: string;
    passwordHash: string;
    name?: string | null;
    role?: Role;
    workspaceId?: number | null;
    isVerified?: boolean;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        name: data.name || null,
        role: data.role || 'USER',
        workspaceId: data.workspaceId || 1,
        isVerified: data.isVerified !== undefined ? data.isVerified : true,
      },
    });
  }

  static async updateLastLogin(id: number, ip?: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        lastLogin: new Date(),
        lastLoginIp: ip || null,
      },
    });
  }

  static async updateVerificationCode(id: number, verifyCode: string | null, isVerified?: boolean): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        verifyCode,
        isVerified: isVerified !== undefined ? isVerified : undefined,
      },
    });
  }

  static async updatePlanStatus(
    id: number,
    data: {
      plan?: string;
      planStatus?: PlanStatus;
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
    }
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  static async listAllUsers(limit = 100, offset = 0) {
    return prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        workspaceId: true,
        plan: true,
        planStatus: true,
        isVerified: true,
        lastLogin: true,
        createdAt: true,
      },
    });
  }

  static async countUsers(): Promise<number> {
    return prisma.user.count();
  }
}

export default UserRepository;

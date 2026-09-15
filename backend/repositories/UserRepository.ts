import 'server-only';
import prisma from '../database/prisma';
import { User, Role, PlanStatus } from '@prisma/client';
import { syncTableSequence, syncAllSequences } from '@/lib/dbSequenceSync';

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
    let targetWorkspaceId = data.workspaceId || 1;
    try {
      const existingWs = await prisma.workspace.findUnique({ where: { id: targetWorkspaceId } });
      if (!existingWs) {
        const createdWs = await prisma.workspace.create({
          data: { name: 'Default Workspace' },
        });
        targetWorkspaceId = createdWs.id;
      }
    } catch (wsErr: any) {
      if (wsErr?.code === 'P2002' || String(wsErr?.message).includes('Unique constraint failed on the fields: (id)')) {
        await syncTableSequence('workspaces');
        try {
          const createdWs = await prisma.workspace.create({
            data: { name: 'Default Workspace' },
          });
          targetWorkspaceId = createdWs.id;
        } catch {
          // Fallback to targetWorkspaceId
        }
      }
    }

    try {
      return await prisma.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          passwordHash: data.passwordHash,
          name: data.name || null,
          role: data.role || 'USER',
          workspaceId: targetWorkspaceId,
          isVerified: data.isVerified !== undefined ? data.isVerified : true,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002' || String(err?.message).includes('Unique constraint failed on the fields: (id)')) {
        console.warn('[UserRepository] Primary key sequence collision detected. Resynchronizing PostgreSQL sequences...');
        await syncAllSequences();
        return await prisma.user.create({
          data: {
            email: data.email.toLowerCase().trim(),
            passwordHash: data.passwordHash,
            name: data.name || null,
            role: data.role || 'USER',
            workspaceId: targetWorkspaceId,
            isVerified: data.isVerified !== undefined ? data.isVerified : true,
          },
        });
      }
      throw err;
    }
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

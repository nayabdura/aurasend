import 'server-only';
import prisma from '../database/prisma';
import { GmailAccount } from '@prisma/client';
import { syncTableSequence } from '@/lib/dbSequenceSync';

export class GmailAccountRepository {
  static async findById(id: number, userId?: number): Promise<GmailAccount | null> {
    const where: any = { id };
    if (userId) where.userId = userId;

    return prisma.gmailAccount.findFirst({
      where,
    });
  }

  static async findByEmail(email: string, userId: number): Promise<GmailAccount | null> {
    return prisma.gmailAccount.findFirst({
      where: {
        userId,
        email: email.toLowerCase().trim(),
      },
    });
  }

  static async findManyByUser(userId: number): Promise<GmailAccount[]> {
    return prisma.gmailAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async upsertAccount(data: {
    userId: number;
    workspaceId?: number;
    email: string;
    name?: string;
    clientId?: string;
    clientSecret?: string;
    authMethod?: string;
    smtpHost?: string;
    smtpPort?: number;
    dailyLimit?: number;
    status?: string;
    isConnected?: boolean;
  }): Promise<GmailAccount> {
    const email = data.email.toLowerCase().trim();

    const upsertData = {
      where: {
        userId_email: {
          userId: data.userId,
          email,
        },
      },
      update: {
        name: data.name || undefined,
        clientId: data.clientId || undefined,
        clientSecret: data.clientSecret || undefined,
        authMethod: data.authMethod || 'oauth',
        smtpHost: data.smtpHost || undefined,
        smtpPort: data.smtpPort || undefined,
        dailyLimit: data.dailyLimit || 20,
        status: data.status || 'pending_auth',
        isConnected: data.isConnected !== undefined ? data.isConnected : false,
      },
      create: {
        userId: data.userId,
        workspaceId: data.workspaceId || 1,
        email,
        name: data.name || email.split('@')[0],
        clientId: data.clientId || undefined,
        clientSecret: data.clientSecret || undefined,
        authMethod: data.authMethod || 'oauth',
        smtpHost: data.smtpHost || 'smtp.gmail.com',
        smtpPort: data.smtpPort || 587,
        dailyLimit: data.dailyLimit || 20,
        status: data.status || 'pending_auth',
        isConnected: data.isConnected !== undefined ? data.isConnected : false,
      },
    };

    try {
      return await prisma.gmailAccount.upsert(upsertData);
    } catch (err: any) {
      if (err?.code === 'P2002' || String(err?.message).includes('Unique constraint failed on the fields: (\'id\')') || String(err?.message).includes('id')) {
        console.warn('[GmailAccountRepository] Sequence collision on gmail_accounts. Syncing sequence...');
        await syncTableSequence('gmail_accounts');
        return await prisma.gmailAccount.upsert(upsertData);
      }
      throw err;
    }
  }

  static async updateTokens(
    id: number,
    accessTokenEncrypted: string,
    refreshTokenEncrypted?: string,
    expiryDate?: bigint
  ): Promise<GmailAccount> {
    return prisma.gmailAccount.update({
      where: { id },
      data: {
        accessTokenEncrypted,
        refreshTokenEncrypted: refreshTokenEncrypted || undefined,
        expiryDate: expiryDate || undefined,
        status: 'active',
        isConnected: true,
      },
    });
  }

  static async incrementSentToday(id: number): Promise<GmailAccount> {
    return prisma.gmailAccount.update({
      where: { id },
      data: {
        sentToday: { increment: 1 },
      },
    });
  }

  static async delete(id: number, userId: number): Promise<GmailAccount> {
    return prisma.gmailAccount.delete({
      where: { id },
    });
  }
}

export default GmailAccountRepository;

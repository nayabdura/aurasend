import 'server-only';
import prisma from '../database/prisma';
import { EmailLog } from '@prisma/client';

export class EmailLogRepository {
  static async findById(id: number, userId?: number): Promise<EmailLog | null> {
    const where: any = { id };
    if (userId) where.userId = userId;

    return prisma.emailLog.findFirst({
      where,
    });
  }

  static async findManyByUser(userId: number, limit = 100, offset = 0): Promise<EmailLog[]> {
    return prisma.emailLog.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'desc' },
      include: {
        lead: true,
        gmailAccount: true,
      },
    });
  }

  static async create(data: {
    userId: number;
    workspaceId?: number;
    leadId?: number | null;
    gmailId?: number | null;
    type?: string;
    messageId?: string | null;
  }): Promise<EmailLog> {
    return prisma.emailLog.create({
      data: {
        userId: data.userId,
        workspaceId: data.workspaceId || 1,
        leadId: data.leadId || null,
        gmailId: data.gmailId || null,
        type: data.type || 'sent',
        messageId: data.messageId || null,
        timestamp: BigInt(Date.now()),
      },
    });
  }

  static async countByUser(userId: number): Promise<number> {
    return prisma.emailLog.count({
      where: { userId },
    });
  }
}

export default EmailLogRepository;

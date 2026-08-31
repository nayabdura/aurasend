import 'server-only';
import prisma from '../database/prisma';
import { Campaign } from '@prisma/client';

export class CampaignRepository {
  static async findById(id: number, userId?: number): Promise<Campaign | null> {
    const where: any = { id };
    if (userId) where.userId = userId;

    return prisma.campaign.findFirst({
      where,
      include: {
        template: true,
        sequences: true,
      },
    });
  }

  static async findManyByUser(userId: number, limit = 100, offset = 0): Promise<Campaign[]> {
    return prisma.campaign.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        template: true,
        sequences: true,
      },
    });
  }

  static async create(data: {
    userId: number;
    workspaceId?: number;
    name: string;
    templateId?: number | null;
    status?: string;
    dailyLimit?: number;
    sendWindowStart?: string;
    sendWindowEnd?: string;
    timezone?: string;
  }): Promise<Campaign> {
    return prisma.campaign.create({
      data: {
        userId: data.userId,
        workspaceId: data.workspaceId || 1,
        name: data.name,
        templateId: data.templateId || null,
        status: data.status || 'draft',
        delayBetweenEmails: data.dailyLimit || 30,
        sendWindowStart: data.sendWindowStart || '09:00',
        sendWindowEnd: data.sendWindowEnd || '17:00',
        timezone: data.timezone || 'America/New_York',
      },
    });
  }

  static async update(id: number, userId: number, data: Partial<Campaign>): Promise<Campaign> {
    return prisma.campaign.update({
      where: { id },
      data,
    });
  }

  static async updateStatus(id: number, userId: number, status: string): Promise<Campaign> {
    return prisma.campaign.update({
      where: { id },
      data: { status },
    });
  }

  static async delete(id: number, userId: number): Promise<Campaign> {
    return prisma.campaign.delete({
      where: { id },
    });
  }
}

export default CampaignRepository;

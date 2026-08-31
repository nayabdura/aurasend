import 'server-only';
import prisma from '../database/prisma';
import { Template } from '@prisma/client';

export class TemplateRepository {
  static async findById(id: number, userId?: number): Promise<Template | null> {
    const where: any = { id };
    if (userId) where.userId = userId;

    return prisma.template.findFirst({
      where,
    });
  }

  static async findManyByUser(userId: number, limit = 100, offset = 0): Promise<Template[]> {
    return prisma.template.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(data: {
    userId: number;
    workspaceId?: number;
    name: string;
    subject: string;
    body: string;
  }): Promise<Template> {
    return prisma.template.create({
      data: {
        userId: data.userId,
        workspaceId: data.workspaceId || 1,
        name: data.name,
        subject: data.subject,
        body: data.body,
      },
    });
  }

  static async update(id: number, userId: number, data: Partial<Template>): Promise<Template> {
    return prisma.template.update({
      where: { id },
      data,
    });
  }

  static async delete(id: number, userId: number): Promise<Template> {
    return prisma.template.delete({
      where: { id },
    });
  }
}

export default TemplateRepository;

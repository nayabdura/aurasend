import 'server-only';
import prisma from '../database/prisma';
import { Lead } from '@prisma/client';

export interface LeadFilter {
  userId: number;
  workspaceId?: number;
  campaignId?: number;
  status?: string;
  search?: string;
  isSuppressed?: boolean;
}

export class LeadRepository {
  static async findById(id: number, userId: number): Promise<Lead | null> {
    return prisma.lead.findFirst({
      where: { id, userId },
    });
  }

  static async findByEmail(email: string, userId: number): Promise<Lead | null> {
    return prisma.lead.findFirst({
      where: {
        userId,
        email: email.toLowerCase().trim(),
      },
    });
  }

  static async findMany(filter: LeadFilter, limit = 100, offset = 0): Promise<Lead[]> {
    const where: any = {
      userId: filter.userId,
    };

    if (filter.workspaceId) where.workspaceId = filter.workspaceId;
    if (filter.campaignId) where.campaignId = filter.campaignId;
    if (filter.status) where.status = filter.status;
    if (filter.isSuppressed !== undefined) where.isSuppressed = filter.isSuppressed;

    if (filter.search) {
      const q = filter.search.toLowerCase();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
      ];
    }

    return prisma.lead.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async count(filter: LeadFilter): Promise<number> {
    const where: any = {
      userId: filter.userId,
    };

    if (filter.workspaceId) where.workspaceId = filter.workspaceId;
    if (filter.campaignId) where.campaignId = filter.campaignId;
    if (filter.status) where.status = filter.status;
    if (filter.isSuppressed !== undefined) where.isSuppressed = filter.isSuppressed;

    return prisma.lead.count({ where });
  }

  static async create(data: Partial<Lead> & { userId: number; email: string }): Promise<Lead> {
    return prisma.lead.create({
      data: {
        userId: data.userId,
        workspaceId: data.workspaceId || 1,
        campaignId: data.campaignId || null,
        name: data.name || null,
        email: data.email.toLowerCase().trim(),
        website: data.website || null,
        company: data.company || null,
        intro: data.intro || null,
        source: data.source || null,
        status: data.status || 'pending',
        leadType: data.leadType || 'client',
        temperature: data.temperature || 'Cold',
        companyDomain: data.companyDomain || null,
        currentRole: data.currentRole || null,
        niche: data.niche || null,
        previousWork: data.previousWork || null,
      },
    });
  }

  static async createManyBatch(leads: Array<Partial<Lead> & { userId: number; email: string }>): Promise<number> {
    const formatted = leads.map((l) => ({
      userId: l.userId,
      workspaceId: l.workspaceId || 1,
      campaignId: l.campaignId || null,
      name: l.name || null,
      email: l.email.toLowerCase().trim(),
      website: l.website || null,
      company: l.company || null,
      intro: l.intro || null,
      source: l.source || null,
      status: l.status || 'pending',
      leadType: l.leadType || 'client',
      temperature: l.temperature || 'Cold',
      companyDomain: l.companyDomain || null,
      currentRole: l.currentRole || null,
      niche: l.niche || null,
      previousWork: l.previousWork || null,
    }));

    const result = await prisma.lead.createMany({
      data: formatted,
      skipDuplicates: true,
    });

    return result.count;
  }

  static async update(id: number, userId: number, data: Partial<Lead>): Promise<Lead> {
    return prisma.lead.update({
      where: { id },
      data,
    });
  }

  static async delete(id: number, userId: number): Promise<Lead> {
    return prisma.lead.delete({
      where: { id },
    });
  }
}

export default LeadRepository;

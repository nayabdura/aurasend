import 'server-only';
import LeadRepository, { LeadFilter } from '../repositories/LeadRepository';
import { Lead } from '@prisma/client';

export class LeadService {
  static async getLeads(filter: LeadFilter, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const [leads, total] = await Promise.all([
      LeadRepository.findMany(filter, limit, offset),
      LeadRepository.count(filter),
    ]);

    return {
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async createLead(userId: number, data: Partial<Lead> & { email: string }): Promise<Lead> {
    const existing = await LeadRepository.findByEmail(data.email, userId);
    if (existing) {
      throw new Error(`Lead with email ${data.email} already exists in your account.`);
    }

    return LeadRepository.create({
      ...data,
      userId,
    });
  }

  static async batchUploadLeads(userId: number, leads: Array<Partial<Lead> & { email: string }>) {
    const validLeads = leads.filter((l) => l.email && l.email.includes('@'));
    const count = await LeadRepository.createManyBatch(
      validLeads.map((l) => ({
        ...l,
        userId,
      }))
    );

    return {
      totalUploaded: validLeads.length,
      importedCount: count,
      duplicatesSkipped: validLeads.length - count,
    };
  }

  static async updateLead(id: number, userId: number, data: Partial<Lead>): Promise<Lead> {
    const lead = await LeadRepository.findById(id, userId);
    if (!lead) {
      throw new Error('Lead not found or unauthorized access.');
    }

    return LeadRepository.update(id, userId, data);
  }

  static async deleteLead(id: number, userId: number): Promise<Lead> {
    const lead = await LeadRepository.findById(id, userId);
    if (!lead) {
      throw new Error('Lead not found or unauthorized access.');
    }

    return LeadRepository.delete(id, userId);
  }
}

export default LeadService;

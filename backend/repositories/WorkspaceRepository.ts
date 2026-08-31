import 'server-only';
import prisma from '../database/prisma';
import { Workspace } from '@prisma/client';

export class WorkspaceRepository {
  static async findById(id: number): Promise<Workspace | null> {
    return prisma.workspace.findUnique({
      where: { id },
    });
  }

  static async create(data: { name: string; customTrackingDomain?: string }): Promise<Workspace> {
    return prisma.workspace.create({
      data: {
        name: data.name,
        customTrackingDomain: data.customTrackingDomain || null,
      },
    });
  }

  static async update(id: number, data: Partial<Workspace>): Promise<Workspace> {
    return prisma.workspace.update({
      where: { id },
      data,
    });
  }
}

export default WorkspaceRepository;

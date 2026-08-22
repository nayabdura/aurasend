import { NextResponse } from 'next/server';
import { requireMaster } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { DEFAULT_PLAN_LIMITS } from '@/lib/usage';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const master = await requireAuthMaster();
        const userId = parseInt(params.id);

        if (isNaN(userId)) {
            return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
        }

        if (userId === master.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        const target = await prisma.user.findUnique({ where: { id: userId } });
        if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        if (target.role === 'MASTER') {
            return NextResponse.json({ error: 'Cannot delete a master admin account' }, { status: 403 });
        }

        await prisma.user.delete({ where: { id: userId } });

        // Record Admin Audit Log
        await prisma.adminAuditLog.create({
          data: {
            adminId: master.id,
            action: 'DELETE_USER',
            target: target.email,
            details: JSON.stringify({ userId }),
          },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const master = await requireAuthMaster();
        const userId = parseInt(params.id);
        if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const data = await request.json();
        const { plan, plan_status, role } = data;

        const target = await prisma.user.findUnique({ where: { id: userId } });
        if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const updateData: any = {};
        if (plan) updateData.plan = plan;
        if (plan_status) updateData.planStatus = plan_status === 'active' ? 'ACTIVE' : 'TRIALING';
        if (role && role !== 'MASTER') updateData.role = role.toUpperCase();

        await prisma.user.update({
          where: { id: userId },
          data: updateData,
        });

        // Update user entitlements if plan changed
        if (plan) {
          const limits = DEFAULT_PLAN_LIMITS[plan] || DEFAULT_PLAN_LIMITS.free;
          for (const [featureKey, grantedLimit] of Object.entries(limits)) {
            await prisma.entitlement.upsert({
              where: { userId_featureKey: { userId, featureKey } },
              update: { grantedLimit, source: 'admin_override' },
              create: { userId, featureKey, grantedLimit, source: 'admin_override' },
            });
          }
        }

        // Record Admin Audit Log
        await prisma.adminAuditLog.create({
          data: {
            adminId: master.id,
            action: 'UPDATE_USER_PLAN_OR_ROLE',
            target: target.email,
            details: JSON.stringify(data),
          },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function requireAuthMaster() {
  const user = await requireMaster();
  return user;
}

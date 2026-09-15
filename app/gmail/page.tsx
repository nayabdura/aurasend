import DashboardLayout from '@/components/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import SenderHubClient from './SenderHubClient';

export const dynamic = 'force-dynamic';

export default async function SenderInfrastructurePage() {
    const user = await requireAuth();

    let accounts: any[] = [];
    try {
        const isMaster = ['MASTER', 'ADMIN'].includes(String(user.role || '').toUpperCase());
        const list = await prisma.gmailAccount.findMany({
            where: isMaster ? {} : { userId: user.id },
            orderBy: { id: 'desc' },
        });
        accounts = list.map((g) => ({
            id: g.id,
            user_id: g.userId,
            workspace_id: g.workspaceId || 1,
            email: g.email,
            name: g.name,
            auth_method: g.authMethod,
            client_id: g.clientId,
            client_secret: g.clientSecret,
            daily_limit: g.dailyLimit,
            sent_today: g.sentToday,
            status: g.status,
            is_connected: g.isConnected ? 1 : 0,
            warmup_enabled: g.warmupEnabled ? 1 : 0,
            warmup_day: g.warmupDay,
            signature: g.signature,
            smtp_host: g.smtpHost,
            smtp_port: g.smtpPort,
            createdAt: g.createdAt ? g.createdAt.toISOString() : null,
        }));
    } catch (e) {
        console.error('[SenderInfrastructurePage] Error fetching accounts:', e);
        accounts = [];
    }

    return (
        <DashboardLayout>
            <SenderHubClient initialAccounts={accounts} userRole={user.role} />
        </DashboardLayout>
    );
}

import DashboardLayout from '@/components/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';
import SenderHubClient from './SenderHubClient';

export const dynamic = 'force-dynamic';

export default async function SenderInfrastructurePage() {
    const user = await requireAuth();

    let accounts: any[] = [];
    if (user.role === 'master') {
        accounts = db.prepare('SELECT * FROM gmail_accounts ORDER BY id DESC').all() as any[];
    } else {
        accounts = db.prepare('SELECT * FROM gmail_accounts WHERE user_id = ? ORDER BY id DESC').all(user.id) as any[];
    }

    return (
        <DashboardLayout>
            <SenderHubClient initialAccounts={accounts} userRole={user.role} />
        </DashboardLayout>
    );
}

import DashboardLayout from '@/components/DashboardLayout';
import LeadsClient from './LeadsClient';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function LeadsPageWrapper() {
    await requireAuth();

    return (
        <DashboardLayout>
            <LeadsClient />
        </DashboardLayout>
    );
}

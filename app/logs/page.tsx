import DashboardLayout from '@/components/DashboardLayout';
import LogsClient from './LogsClient';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
    await requireAuth();

    return (
        <DashboardLayout>
            <LogsClient />
        </DashboardLayout>
    );
}

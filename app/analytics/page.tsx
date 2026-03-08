import DashboardLayout from '@/components/DashboardLayout';
import AnalyticsClient from './AnalyticsClient';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
    await requireAuth();

    return (
        <DashboardLayout>
            <AnalyticsClient />
        </DashboardLayout>
    );
}

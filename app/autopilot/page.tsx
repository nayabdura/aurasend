import DashboardLayout from '@/components/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import AutopilotClient from './AutopilotClient';

export const dynamic = 'force-dynamic';

export default async function AutopilotPage() {
    await requireAuth();
    return (
        <DashboardLayout>
            <AutopilotClient />
        </DashboardLayout>
    );
}

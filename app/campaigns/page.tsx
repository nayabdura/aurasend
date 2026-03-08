import DashboardLayout from '@/components/DashboardLayout';
import CampaignsClient from './CampaignsClient';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
    await requireAuth();

    return (
        <DashboardLayout>
            <CampaignsClient />
        </DashboardLayout>
    );
}

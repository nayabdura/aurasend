import DashboardLayout from '@/components/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import FollowUpsClient from './FollowUpsClient';

export const dynamic = 'force-dynamic';

export default async function FollowUpsPage() {
    await requireAuth();
    return (
        <DashboardLayout>
            <FollowUpsClient />
        </DashboardLayout>
    );
}

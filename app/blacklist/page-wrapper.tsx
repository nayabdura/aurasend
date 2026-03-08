import DashboardLayout from '@/components/DashboardLayout';
import BlacklistClient from './BlacklistClient';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function BlacklistPageWrapper() {
    await requireAuth();

    return (
        <DashboardLayout>
            <BlacklistClient />
        </DashboardLayout>
    );
}

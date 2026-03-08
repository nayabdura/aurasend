import DashboardLayout from '@/components/DashboardLayout';
import TestingCenterClient from './TestingCenterClient';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function TestingCenterPageWrapper() {
    await requireAuth();

    return (
        <DashboardLayout>
            <TestingCenterClient />
        </DashboardLayout>
    );
}

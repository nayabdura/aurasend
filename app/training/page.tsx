import DashboardLayout from '@/components/DashboardLayout';
import TrainingClient from './TrainingClient';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function TrainingPage() {
    await requireAuth();

    return (
        <DashboardLayout>
            <TrainingClient />
        </DashboardLayout>
    );
}

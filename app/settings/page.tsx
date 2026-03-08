import DashboardLayout from '@/components/DashboardLayout';
import SettingsClient from './SettingsClient';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    await requireAuth();

    return (
        <DashboardLayout>
            <SettingsClient />
        </DashboardLayout>
    );
}

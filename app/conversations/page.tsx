import DashboardLayout from '@/components/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import ConversationsClient from './ConversationsClient';

export const dynamic = 'force-dynamic';

export default async function ConversationsPage() {
    await requireAuth();
    return (
        <DashboardLayout>
            <ConversationsClient />
        </DashboardLayout>
    );
}

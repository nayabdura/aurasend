import DashboardLayout from '@/components/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import ContactsClient from './ContactsClient';

export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
    await requireAuth();
    return (
        <DashboardLayout>
            <ContactsClient />
        </DashboardLayout>
    );
}

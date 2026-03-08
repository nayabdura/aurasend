import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import TrackerClient from './TrackerClient';

export const metadata = {
    title: 'Email Tracker — OutreachOS',
    description: 'Real-time email open tracking across all your Gmail accounts',
};

export default async function TrackerPage() {
    try {
        await requireAuth();
    } catch {
        redirect('/login');
    }
    return (
        <DashboardLayout>
            <TrackerClient />
        </DashboardLayout>
    );
}

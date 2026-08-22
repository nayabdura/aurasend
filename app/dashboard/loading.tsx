import DashboardLayout from '@/components/DashboardLayout';
import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
    return (
        <DashboardLayout>
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
                <Loader2 size={40} className="animate-spin text-indigo-500" />
                <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400 animate-pulse">Loading dashboard statistics...</p>
            </div>
        </DashboardLayout>
    );
}

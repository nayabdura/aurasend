'use client';

import { useEffect, useState } from 'react';
import { Send, TrendingUp, Mail, AlertTriangle, Play } from 'lucide-react';

export default function DashboardClient({ initialActivities }: { initialActivities: any[] }) {
    const [activities, setActivities] = useState(initialActivities);

    useEffect(() => {
        const eventSource = new EventSource('/api/events/stream');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'connected') return;

                // Map the event payload to an activity log format
                const newActivity = {
                    id: Date.now(), // temporary unique id
                    type: data.type.toLowerCase(),
                    timestamp: data.timestamp / 1000,
                    lead_email: data.details?.to || data.details?.email || 'Unknown',
                    gmail_email: data.details?.account || 'System',
                };

                setActivities((prev) => [newActivity, ...prev].slice(0, 5));
            } catch (e) {
                console.error("Error parsing event stream data", e);
            }
        };

        return () => {
            eventSource.close();
        };
    }, []);

    if (activities.length === 0) {
        return <p className="text-slate-500 dark:text-zinc-50 text-sm italic">No recent activity found.</p>;
    }

    return (
        <div className="space-y-4">
            {activities.map((log: any) => {
                const displayType = log.type.replace('_', ' ');
                const isSent = log.type.includes('sent') || log.type.includes('email');
                const isReply = log.type.includes('replied') || log.type.includes('reply');
                const isError = log.type.includes('bounce') || log.type.includes('error');
                const isWarmup = log.type.includes('warmup');

                const bgColor = isSent ? 'bg-blue-100 text-blue-600' :
                    isReply ? 'bg-purple-100 text-purple-600' :
                        isError ? 'bg-red-100 text-red-600' :
                            isWarmup ? 'bg-orange-100 text-orange-600' :
                                'bg-green-100 text-green-600';

                const Icon = isReply ? TrendingUp : isError ? AlertTriangle : isWarmup ? Play : Send;

                return (
                    <div key={log.id} className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 rounded-xl transition-colors animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className={`p-2 rounded-lg ${bgColor}`}>
                            <Icon size={16} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-50 capitalize">{displayType}</p>
                            <p className="text-xs text-slate-500 dark:text-zinc-50">
                                {log.lead_email ? `To: ${log.lead_email}` : ''}
                                {log.gmail_email && ` (via ${log.gmail_email})`}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(log.timestamp * 1000).toLocaleString()}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

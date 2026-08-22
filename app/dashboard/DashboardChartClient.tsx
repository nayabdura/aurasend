'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DashboardChartClient({ rawData }: { rawData: any[] }) {
    if (!rawData || rawData.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30/50 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 dark:border-zinc-800">
                <p className="text-gray-400 font-medium">No sending data for the last 7 days.</p>
            </div>
        );
    }

    // Format data slightly if needed.
    const formattedData = rawData.map((d: any) => {
        const dateObj = new Date(d.date);
        return {
            name: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
            sent: d.sent
        };
    });

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="sent" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

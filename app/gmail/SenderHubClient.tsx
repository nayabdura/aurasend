'use client';

import { useState } from 'react';
import { Mail, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import GmailPageClient from './GmailPageClient';
import AddAccountForm from '@/components/AddAccountForm';
import GmailAccountCard from '@/components/GmailAccountCard';
import WarmupClient from '../warmup/WarmupClient';
import DeliverabilityClient from '../deliverability/DeliverabilityClient';

export default function SenderHubClient({ initialAccounts, userRole }: { initialAccounts: any[], userRole: string }) {
    const [activeTab, setActiveTab] = useState<'accounts' | 'warmup' | 'deliverability'>('accounts');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-sm gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-50 tracking-tight mb-2">Sender Infrastructure</h1>
                    <p className="text-zinc-400">Manage accounts, warmup health, and deliverability limits.</p>
                </div>
                <div className="flex gap-2 border-b border-zinc-800 pb-0">
                    <TabButton
                        active={activeTab === 'accounts'}
                        onClick={() => setActiveTab('accounts')}
                        icon={<Mail size={18} />}
                        label="Accounts"
                    />
                    <TabButton
                        active={activeTab === 'warmup'}
                        onClick={() => setActiveTab('warmup')}
                        icon={<Zap size={18} />}
                        label="Warmup Center"
                    />
                    <TabButton
                        active={activeTab === 'deliverability'}
                        onClick={() => setActiveTab('deliverability')}
                        icon={<Activity size={18} />}
                        label="Deliverability"
                    />
                </div>
            </div>

            <div className="animate-in fade-in duration-500">
                {activeTab === 'accounts' && (
                    <div className="space-y-8">
                        <GmailPageClient />

                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                            <AddAccountForm />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                                Connected Accounts
                                <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full text-xs">{initialAccounts.length}</span>
                            </h2>
                            {initialAccounts.length === 0 ? (
                                <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
                                    <div className="text-5xl mb-4 opacity-50">📭</div>
                                    <h3 className="text-lg font-bold text-zinc-200 mb-1">No accounts connected yet</h3>
                                    <p className="text-sm text-zinc-500">Use the form above to add your first Gmail account.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {initialAccounts.map((account: any) => (
                                        <div key={account.id} className="dark-card">
                                            <GmailAccountCard account={account} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'warmup' && (
                    <div className="bg-zinc-900 border border-zinc-800 p-6 lg:p-8 rounded-2xl">
                        <WarmupClient />
                    </div>
                )}

                {activeTab === 'deliverability' && (
                    <div className="bg-zinc-900 border border-zinc-800 p-6 lg:p-8 rounded-2xl">
                        <DeliverabilityClient />
                    </div>
                )}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all text-sm border-b-2 ${active
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

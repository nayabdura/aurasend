'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { CreditCard, CheckCircle2, Zap, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function BillingSettings() {
    const [plan, setPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/plan/usage')
            .then(r => r.json())
            .then(d => { setPlan(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    function UsageBar({ label, used, max, formatted }: any) {
        const pct = max === -1 ? 0 : Math.min(100, Math.round((used / max) * 100));
        const isUnlimited = max === -1;
        const isWarning = pct > 80;
        return (
            <div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    <span className="text-sm text-slate-500">{used.toLocaleString()} / {formatted}</span>
                </div>
                {!isUnlimited && (
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${isWarning ? 'bg-rose-500' : 'bg-indigo-600'}`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                )}
                {isUnlimited && (
                    <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full w-full" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8 pt-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Billing & Plan</h1>
                        <p className="text-slate-500">Manage your subscription, limits, and features.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-10 animate-pulse h-32" />
                ) : plan ? (
                    <>
                        {/* Current plan card */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Current Plan</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-black text-slate-900">{plan.planName}</span>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${plan.planStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {plan.planStatus}
                                    </span>
                                </div>
                            </div>
                            {plan.plan !== 'unlimited' && (
                                <Link href="/pricing" target="_blank" className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2 whitespace-nowrap">
                                    <Zap size={16} />
                                    Upgrade Plan
                                </Link>
                            )}
                        </div>

                        {/* Usage */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-6">Usage This Month</h2>
                            <div className="space-y-6">
                                <UsageBar label="Gmail / SMTP Accounts" {...plan.limits.gmailAccounts} />
                                <UsageBar label="Emails Sent" {...plan.limits.monthlyEmails} />
                                <UsageBar label="Contacts" {...plan.limits.contacts} />
                                <UsageBar label="Active Campaigns" {...plan.limits.campaigns} />
                            </div>
                        </div>

                        {/* Feature access */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-6">Feature Access</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'AI Autopilot', enabled: plan.features.canUseAI },
                                    { label: 'B2B Enrichment Engine', enabled: plan.features.canUseEnrichment },
                                    { label: 'Follow-up Sequences', enabled: plan.features.canUseFollowUps },
                                    { label: 'Per-Gmail Lead Sheets', enabled: plan.features.canUsePerAccountLeads },
                                    { label: 'Advanced Analytics', enabled: plan.features.canUseAnalytics },
                                ].map(f => (
                                    <div key={f.label} className={`flex items-center gap-3 p-4 rounded-xl border ${f.enabled ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                                        {f.enabled ? (
                                            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                                        ) : (
                                            <AlertCircle size={18} className="text-slate-400 shrink-0" />
                                        )}
                                        <span className={`text-sm font-semibold ${f.enabled ? 'text-emerald-800' : 'text-slate-500'}`}>{f.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : null}

                {/* Plan options */}
                <div className="grid md:grid-cols-2 gap-8">
                    <PlanCard
                        name="Starter"
                        price="PKR 2,000"
                        tagline="For individuals getting started"
                        features={['3 Gmail Accounts', '500 Sends/month', '5 Campaigns', 'Basic Analytics']}
                        active={plan?.plan === 'starter'}
                    />
                    <PlanCard
                        name="Unlimited"
                        price="PKR 10,000"
                        tagline="Everything, no limits"
                        features={['Unlimited Inboxes', 'Unlimited Sends', 'AI Autopilot', 'Per-Account Lead Sheets', 'Enrichment Engine']}
                        active={plan?.plan === 'unlimited'}
                        featured
                    />
                </div>

                <p className="text-sm text-slate-400 text-center">
                    To change your plan, contact our team or visit <Link href="/contact" className="text-indigo-600 hover:underline">support</Link>.
                </p>
            </div>
        </DashboardLayout>
    );
}

function PlanCard({ name, price, tagline, features, active, featured }: any) {
    return (
        <div className={`p-8 rounded-3xl border ${featured ? 'border-indigo-600 shadow-xl shadow-indigo-100' : 'border-slate-200 bg-white shadow-sm'}`}>
            {active && (
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                    Current Plan
                </span>
            )}
            <h3 className="text-xl font-bold text-slate-900 mb-1">{name}</h3>
            <p className="text-3xl font-black text-slate-900 tracking-tight mb-1">{price}<span className="text-sm font-semibold text-slate-400">/mo</span></p>
            <p className="text-sm text-slate-500 mb-6">{tagline}</p>
            <ul className="space-y-3 mb-8">
                {features.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        {f}
                    </li>
                ))}
            </ul>
        </div>
    );
}

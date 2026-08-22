'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, ArrowRight, HelpCircle, Sparkles } from 'lucide-react';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';

const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        price: 'PKR 2,000',
        period: '/month',
        description: 'Everything you need to start your cold email journey.',
        featured: false,
        buttonText: 'Start for Free',
        features: [
            { label: '3 Gmail / SMTP Accounts', included: true },
            { label: '500 Emails per month', included: true },
            { label: 'Basic Campaign Management', included: true },
            { label: 'Email Verification (100/mo)', included: true },
            { label: 'Contact Management (500 leads)', included: true },
            { label: 'Basic Analytics Dashboard', included: true },
            { label: 'Account Warmup (3 accounts)', included: true },
            { label: 'Unlimited Inboxes', included: false },
            { label: 'AI Autopilot Mode', included: false },
            { label: 'Smart Follow-up Sequences', included: false },
            { label: 'Priority Support', included: false },
        ],
    },
    {
        id: 'unlimited',
        name: 'Unlimited',
        price: 'PKR 10,000',
        period: '/month',
        description: 'Full platform access. No caps. No restrictions. Maximum results.',
        featured: true,
        buttonText: 'Get Unlimited',
        features: [
            { label: 'Unlimited Gmail / SMTP Accounts', included: true },
            { label: 'Unlimited Monthly Sends', included: true },
            { label: 'Full Campaign Management', included: true },
            { label: 'Unlimited Email Verification', included: true },
            { label: 'Unlimited Contacts & Lead Sheets', included: true },
            { label: 'Advanced Analytics & Reporting', included: true },
            { label: 'Unlimited Account Warmup', included: true },
            { label: 'Unlimited Inboxes', included: true },
            { label: 'AI Autopilot Mode', included: true },
            { label: 'Smart Follow-up Sequences', included: true },
            { label: 'Priority 24/7 Support', included: true },
        ],
    },
];

export default function PricingPage() {
    const [annual, setAnnual] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-900/50 font-sans">
            <MarketingNav active="/pricing" />

            <main className="pt-32 pb-24 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold tracking-wide shadow-sm mb-6">
                            <Sparkles size={16} /> Transparent Pricing
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-zinc-50 tracking-tight mb-6">
                            Scale without <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500">
                                per-inbox fees.
                            </span>
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto font-medium">
                            Choose the plan that fits your growth. Upgrade, downgrade, or cancel anytime.
                        </p>

                        <div className="flex items-center justify-center gap-4 mt-10">
                            <span className={`text-sm font-bold transition-colors ${!annual ? 'text-slate-900 dark:text-zinc-50' : 'text-slate-400'}`}>Monthly</span>
                            <button
                                onClick={() => setAnnual(!annual)}
                                className="w-16 h-8 bg-indigo-100 rounded-full relative p-1 transition-colors hover:bg-indigo-200"
                            >
                                <div className={`w-6 h-6 bg-indigo-600 rounded-full shadow-md transition-transform duration-300 ${annual ? 'translate-x-8' : ''}`} />
                            </button>
                            <span className={`text-sm font-bold flex items-center gap-2 transition-colors ${annual ? 'text-slate-900 dark:text-zinc-50' : 'text-slate-400'}`}>
                                Annually <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-md">Save 20%</span>
                            </span>
                        </div>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-24">
                        {PLANS.map(plan => (
                            <div key={plan.id} className={`rounded-3xl p-10 relative overflow-hidden transition-all duration-300 hover:-translate-y-2 ${plan.featured
                                ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl shadow-indigo-500/20 ring-4 ring-indigo-500/30'
                                : 'bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-xl shadow-slate-200/50 hover:border-indigo-200'
                                }`}>
                                {plan.featured && (
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                                )}

                                <div className="relative z-10">
                                    {plan.featured && (
                                        <div className="absolute -top-4 -right-4 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-bl-2xl rounded-tr-2xl shadow-lg">
                                            Most Popular
                                        </div>
                                    )}
                                    <h2 className={`text-3xl font-black mb-4 ${plan.featured ? 'text-white' : 'text-slate-900 dark:text-zinc-50'}`}>{plan.name}</h2>
                                    <p className={`text-base font-medium leading-relaxed h-12 mb-6 ${plan.featured ? 'text-slate-300' : 'text-slate-500 dark:text-zinc-400'}`}>{plan.description}</p>

                                    <div className="flex items-baseline gap-1 mb-8">
                                        <span className={`text-6xl font-black tracking-tight ${plan.featured ? 'text-white' : 'text-slate-900 dark:text-zinc-50'}`}>
                                            {annual && plan.id === 'starter' ? 'PKR 1,600' : annual && plan.id === 'unlimited' ? 'PKR 8,000' : plan.price}
                                        </span>
                                        <span className={`font-semibold ${plan.featured ? 'text-slate-400' : 'text-slate-500 dark:text-zinc-400'}`}>{plan.period}</span>
                                    </div>

                                    <Link
                                        href={`/login?plan=${plan.id}`}
                                        className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-lg transition-all mb-10 shadow-lg ${plan.featured
                                            ? 'bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white shadow-indigo-500/25'
                                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                                            }`}
                                    >
                                        {plan.buttonText} <ArrowRight size={20} />
                                    </Link>

                                    <div className={`text-sm font-bold uppercase tracking-widest mb-6 ${plan.featured ? 'text-indigo-300' : 'text-indigo-600'}`}>
                                        What's included
                                    </div>

                                    <ul className="space-y-4">
                                        {plan.features.map((f, i) => (
                                            <li key={i} className="flex items-center gap-4">
                                                {f.included ? (
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${plan.featured ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-100 text-emerald-600'}`}>
                                                        <CheckCircle2 size={16} className={(plan.featured && !f.included) ? '' : ''} />
                                                    </div>
                                                ) : (
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${plan.featured ? 'bg-slate-800 text-slate-600 dark:text-zinc-400' : 'bg-slate-100 dark:bg-zinc-800/50 text-slate-400'}`}>
                                                        <XCircle size={16} />
                                                    </div>
                                                )}
                                                <span className={`text-base font-semibold ${f.included
                                                    ? (plan.featured ? 'text-slate-100' : 'text-slate-700 dark:text-zinc-300')
                                                    : (plan.featured ? 'text-slate-600 dark:text-zinc-400' : 'text-slate-400')
                                                    }`}>
                                                    {f.label}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* FAQ */}
                    <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900/60 rounded-3xl p-10 border border-slate-200 dark:border-zinc-800 shadow-xl shadow-slate-200/50">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-black text-slate-900 dark:text-zinc-50 tracking-tight mb-4">Frequently Asked Questions</h2>
                            <p className="text-lg text-slate-500 dark:text-zinc-400">Everything you need to know before getting started.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            {[
                                { q: 'Can I upgrade or downgrade my plan?', a: 'Yes. Switch between plans at any time. Upgrades take effect immediately. Downgrades apply at the start of your next billing cycle.' },
                                { q: 'What payment methods are accepted?', a: 'We accept all major credit and debit cards, bank transfers, and local Pakistani payment methods including JazzCash and EasyPaisa.' },
                                { q: 'Is there a free trial?', a: 'You can sign up and explore the platform for free. Activating campaigns or connecting inboxes requires a plan.' },
                                { q: 'What happens if I cancel?', a: 'Your data remains accessible for 30 days after cancellation. After that, it is permanently and securely deleted from our servers.' },
                                { q: 'Are there per-inbox or per-seat fees?', a: 'Never. Both plans include as many inboxes and seats as described. No hidden usage fees.' },
                                { q: 'How does the warmup work?', a: 'We automatically interact with your emails in a private pool of over 50,000 real accounts, moving them out of spam and marking them as important to boost sender reputation.' },
                            ].map(({ q, a }) => (
                                <div key={q} className="bg-slate-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/80">
                                    <div className="flex gap-3 mb-3">
                                        <HelpCircle size={24} className="text-indigo-500 shrink-0" />
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">{q}</h3>
                                    </div>
                                    <p className="text-slate-500 dark:text-zinc-400 leading-relaxed font-medium pl-9">{a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}

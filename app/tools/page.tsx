import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { SearchCheck, Shield, Zap, Users, TestTube, Target, BarChart2, ArrowRight, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: 'AuraSend Tools — Email Verification, Warmup, Campaigns & More',
    description: 'Explore all the powerful tools inside AuraSend: Email Verifier, Inbox Warmup, Drip Campaigns, Spam Checker, Leads Manager, and Testing Center. Built for serious B2B outreach.',
    keywords: 'email verifier, inbox warmup, cold email campaigns, spam checker, lead management, email testing',
};

const TOOLS = [
    {
        icon: SearchCheck,
        label: 'Email Verifier',
        href: '/email-verifier',
        color: 'indigo',
        tag: 'Free Tool',
        desc: 'Verify any email address in real-time. Our 7-layer check catches invalid, disposable, and catch-all emails to cut your bounce rate to near zero.',
        features: ['MX Record check', 'SMTP ping verification', 'Disposable email detection', '5 free verifications/day'],
    },
    {
        icon: Target,
        label: 'Spam Checker',
        href: '/spam-checker',
        color: 'red',
        tag: 'Free Tool',
        desc: 'Paste your email content and subject line. We score it against 100+ spam filter rules so you can fix issues before hitting send.',
        features: ['Spam word detection', 'HTML structure check', 'Subject line analysis', 'Compliance validation'],
    },
    {
        icon: Shield,
        label: 'Email Warmup',
        href: '/tools/email-warmup',
        color: 'purple',
        tag: 'Dashboard',
        desc: 'Connect your inbox and our peer-to-peer network automatically builds your sender reputation with real interactions — opens, replies, and engagements.',
        features: ['Auto ramp-up schedule', 'Reply simulation', 'Spam rescue', 'Multi-inbox support'],
    },
    {
        icon: Zap,
        label: 'Drip Campaigns',
        href: '/tools/campaigns',
        color: 'blue',
        tag: 'Dashboard',
        desc: 'Build multi-step cold email sequences with smart delays, A/B testing, spintax personalization, and automatic follow-ups that stop on reply.',
        features: ['Unlimited follow-ups', 'A/B testing', 'Spintax variables', 'Reply detection'],
    },
    {
        icon: Users,
        label: 'Leads & Lists',
        href: '/tools/leads',
        color: 'orange',
        tag: 'Dashboard',
        desc: 'Import leads from CSV, enrich data, filter by status, and manage your entire pipeline. Assign leads directly to campaigns with one click.',
        features: ['CSV import/export', 'Smart filtering', 'Duplicate detection', 'Campaign assignment'],
    },
    {
        icon: TestTube,
        label: 'Testing Center',
        href: '/tools/testing-center',
        color: 'teal',
        tag: 'Free Tool',
        desc: 'Run a full pre-send diagnostic on your email. Catch spam triggers, broken HTML, missing compliance elements and inbox placement issues before launch.',
        features: ['Spam score analysis', 'Inbox placement test', 'Compliance checker', 'HTML validator'],
    },
];

const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
};

const tagColorMap: Record<string, string> = {
    'Free Tool': 'bg-emerald-100 text-emerald-700',
    'Dashboard': 'bg-slate-100 text-slate-600',
};

export default function ToolsPage() {
    return (
        <div className="min-h-screen bg-white font-sans">
            <MarketingNav active="/tools" />
            <main className="pt-20">
                {/* Hero */}
                <section className="py-28 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-700/10 blur-[120px] rounded-full" />
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-700/10 blur-[100px] rounded-full" />
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                    </div>
                    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-slate-300 text-sm font-semibold mb-8">
                            ✦ The AuraSend Toolkit
                        </div>
                        <h1 className="text-6xl font-black text-white mb-6 leading-tight">
                            Every tool you need to<br />
                            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                win at cold outreach.
                            </span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            AuraSend brings every critical outreach tool into one unified platform — from verifying emails and warming up inboxes to running campaigns and tracking conversions.
                        </p>
                    </div>
                </section>

                {/* Tools Grid */}
                <section className="py-24 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {TOOLS.map((tool) => {
                                const colorClass = colorMap[tool.color] || 'bg-slate-50 text-slate-600 border-slate-100';
                                return (
                                    <div key={tool.href} className="bg-white rounded-3xl border border-slate-200 p-8 hover:border-slate-300 hover:shadow-xl transition-all duration-300 group flex flex-col">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${colorClass}`}>
                                                <tool.icon size={28} />
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${tagColorMap[tool.tag]}`}>{tool.tag}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 mb-3">{tool.label}</h3>
                                        <p className="text-slate-500 leading-relaxed mb-6 flex-1">{tool.desc}</p>
                                        <ul className="space-y-2 mb-6">
                                            {tool.features.map((f) => (
                                                <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                                                    <CheckCircle className="text-emerald-500 shrink-0" size={15} />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                        <Link href={tool.href} className="flex items-center gap-2 font-bold text-sm text-slate-900 hover:text-indigo-600 group-hover:gap-3 transition-all">
                                            Learn More <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Comparison: Free vs Dashboard Tools */}
                <section className="py-24 bg-white">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-4xl font-black text-slate-900 mb-4">Try before you commit</h2>
                        <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto">Several tools are available for free without an account — limited to 5 uses per day. Sign up to unlock everything.</p>
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 text-left">
                                <h3 className="font-black text-xl text-slate-900 mb-5">Free (No account)</h3>
                                <ul className="space-y-3">
                                    {['Email Verifier (5/day)', 'Spam Checker (5/day)', 'Email Testing Center (5/day)'].map((f) => (
                                        <li key={f} className="flex items-center gap-3 text-slate-700 font-medium">
                                            <CheckCircle className="text-emerald-500 shrink-0" size={18} /> {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-left text-white">
                                <h3 className="font-black text-xl text-white mb-5">Signed In (Unlimited)</h3>
                                <ul className="space-y-3">
                                    {['Unlimited verifications and checks', 'Inbox warmup for all accounts', 'Full campaign builder access', 'Lead list management & CRM', 'Analytics and conversion tracking'].map((f) => (
                                        <li key={f} className="flex items-center gap-3 text-indigo-100 font-medium">
                                            <CheckCircle className="text-white shrink-0" size={18} /> {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/login" className="mt-6 inline-flex items-center gap-2 h-12 px-6 bg-white text-indigo-700 font-bold rounded-full text-sm hover:shadow-lg transition-all">
                                    Start Free <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <MarketingFooter />
        </div>
    );
}

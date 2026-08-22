'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
    Facebook, Instagram, Twitter, Youtube, Linkedin,
    SearchCheck, Shield, Zap, Users, TestTube, Target,
    ChevronDown, X, Menu, ArrowRight, BarChart2, Mail,
    Inbox, Settings
} from 'lucide-react';

// ------------------------------------------------------------
// Logo Component — always renders (SVG inline fallback)
// ------------------------------------------------------------
function AuraSendLogo({ size = 36 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            style={{ borderRadius: '22%', flexShrink: 0 }}
        >
            <defs>
                <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4F46E5" />
                    <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
                <linearGradient id="logoBolt" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
            </defs>
            <rect width="100" height="100" rx="22" fill="url(#logoBg)" />
            <rect x="18" y="34" width="64" height="42" rx="6" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
            <polyline points="18,40 50,60 82,40" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            <polygon points="55,20 43,50 52,50 45,80 63,44 53,44 60,20" fill="url(#logoBolt)" opacity="0.95" />
        </svg>
    );
}

// ------------------------------------------------------------
// Tool definitions — matching all dashboard tools
// ------------------------------------------------------------
const TOOLS = [
    { icon: SearchCheck, label: 'Email Verifier', href: '/email-verifier', desc: 'Verify emails in real-time', color: 'text-indigo-500', tag: 'Free' },
    { icon: Target, label: 'Spam Checker', href: '/spam-checker', desc: 'Check deliverability score', color: 'text-red-500', tag: 'Free' },
    { icon: Shield, label: 'Email Warmup', href: '/tools/email-warmup', desc: 'Build sender reputation', color: 'text-purple-500', tag: '' },
    { icon: Zap, label: 'Drip Campaigns', href: '/tools/campaigns', desc: 'Automate follow-up sequences', color: 'text-blue-500', tag: '' },
    { icon: Users, label: 'Leads & Lists', href: '/tools/leads', desc: 'Manage your lead database', color: 'text-orange-500', tag: '' },
    { icon: TestTube, label: 'Testing Center', href: '/tools/testing-center', desc: 'Pre-send email diagnostics', color: 'text-teal-500', tag: 'Free' },
    { icon: BarChart2, label: 'Analytics', href: '/tools/analytics', desc: 'Campaign performance data', color: 'text-cyan-500', tag: '' },
    { icon: Inbox, label: 'Conversations', href: '/tools/conversations', desc: 'Unified reply inbox', color: 'text-emerald-500', tag: '' },
];

const NAV_LINKS = [
    { href: '/features', label: 'Features' },
    { href: '/use-cases', label: 'Use Cases' },
    { href: '/integrations', label: 'Integrations' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
];

// ------------------------------------------------------------
// Nav
// ------------------------------------------------------------
export function MarketingNav({ active }: { active?: string }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [toolsOpen, setToolsOpen] = useState(false);

    return (
        <>
            <nav className="fixed top-0 w-full z-50 bg-white dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800/80 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 shrink-0">
                        <AuraSendLogo size={36} />
                        <span className="text-xl font-black text-slate-900 dark:text-zinc-50 tracking-tight hidden sm:block">AuraSend</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden xl:flex items-center gap-0.5 text-sm font-semibold text-slate-600 dark:text-zinc-400 flex-1 justify-center">
                        {/* Tools Mega Menu */}
                        <div
                            className="relative"
                            onMouseEnter={() => setToolsOpen(true)}
                            onMouseLeave={() => setToolsOpen(false)}
                        >
                            <button className={`flex items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-slate-100 dark:bg-zinc-800/50 hover:text-slate-900 dark:text-zinc-50 transition-colors ${toolsOpen ? 'bg-slate-100 dark:bg-zinc-800/50 text-slate-900 dark:text-zinc-50' : ''}`}>
                                Tools
                                <ChevronDown size={14} className={`transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Mega menu */}
                            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[560px] bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl shadow-slate-200/80 p-4 transition-all duration-150 ${toolsOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">Platform Tools</p>
                                <div className="grid grid-cols-2 gap-1">
                                    {TOOLS.map((tool) => (
                                        <Link
                                            key={tool.href}
                                            href={tool.href}
                                            className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:bg-zinc-900/50 transition-colors group"
                                        >
                                            <div className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800/50 flex items-center justify-center shrink-0 mt-0.5 ${tool.color} group-hover:bg-white dark:bg-zinc-900/60 group-hover:shadow-sm transition-all`}>
                                                <tool.icon size={16} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-indigo-600 transition-colors">{tool.label}</span>
                                                    {tool.tag && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold leading-none">{tool.tag}</span>}
                                                </div>
                                                <span className="text-xs text-slate-400 font-normal leading-tight">{tool.desc}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <div className="border-t border-slate-100 dark:border-zinc-800/80 mt-3 pt-3 px-2 flex items-center justify-between">
                                    <Link href="/tools" className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 group">
                                        View all tools <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <span className="text-xs text-slate-400">3 free tools • No signup needed</span>
                                </div>
                            </div>
                        </div>

                        {NAV_LINKS.map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                className={`px-4 py-2 rounded-lg hover:bg-slate-100 dark:bg-zinc-800/50 hover:text-slate-900 dark:text-zinc-50 transition-colors whitespace-nowrap ${active === l.href ? 'text-indigo-600 bg-indigo-50' : ''}`}
                            >
                                {l.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Link href="/login" className="hidden sm:block text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:text-zinc-50 px-4 py-2 rounded-lg hover:bg-slate-100 dark:bg-zinc-800/50 transition-colors">
                            Log in
                        </Link>
                        <Link href="/login" className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/30">
                            Get Started
                        </Link>
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="xl:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:bg-zinc-800/50 transition-colors text-slate-600 dark:text-zinc-400"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileOpen && (
                    <div className="xl:hidden bg-white dark:bg-zinc-900/60 border-t border-slate-200 dark:border-zinc-800 px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Tools</p>
                        {TOOLS.map((tool) => (
                            <Link
                                key={tool.href}
                                href={tool.href}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:bg-zinc-900/50 transition-colors"
                            >
                                <tool.icon size={18} className={tool.color} />
                                <div>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300 block">{tool.label}</span>
                                    <span className="text-xs text-slate-400">{tool.desc}</span>
                                </div>
                            </Link>
                        ))}
                        <div className="border-t border-slate-100 dark:border-zinc-800/80 my-2 pt-2" />
                        {NAV_LINKS.map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                onClick={() => setMobileOpen(false)}
                                className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:bg-zinc-900/50 transition-colors"
                            >
                                {l.label}
                            </Link>
                        ))}
                        <div className="pt-3 pb-1 grid grid-cols-2 gap-2">
                            <Link href="/login" onClick={() => setMobileOpen(false)} className="h-11 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl flex items-center justify-center text-sm">
                                Log in
                            </Link>
                            <Link href="/login" onClick={() => setMobileOpen(false)} className="h-11 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center text-sm">
                                Get Started
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Click-away overlay */}
            {toolsOpen && (
                <div className="fixed inset-0 z-40" onMouseEnter={() => setToolsOpen(false)} />
            )}
        </>
    );
}

// ------------------------------------------------------------
// Footer
// ------------------------------------------------------------
export function MarketingFooter() {
    return (
        <footer className="bg-slate-950 text-white">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-5">
                            <AuraSendLogo size={40} />
                            <span className="font-black text-white text-xl tracking-tight">AuraSend</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-6">
                            The all-in-one B2B outreach platform. Verify emails, warm up inboxes, build intelligent drip campaigns, and close more deals — from one unified workspace.
                        </p>
                        {/* Social Icons */}
                        <div className="flex items-center gap-2.5">
                            {[
                                { Icon: Facebook, href: '#', hover: 'hover:border-blue-500/50 hover:text-blue-400' },
                                { Icon: Instagram, href: '#', hover: 'hover:border-pink-500/50 hover:text-pink-400' },
                                { Icon: Twitter, href: '#', hover: 'hover:border-sky-500/50 hover:text-sky-400' },
                                { Icon: Youtube, href: '#', hover: 'hover:border-red-500/50 hover:text-red-400' },
                                { Icon: Linkedin, href: '#', hover: 'hover:border-blue-600/50 hover:text-blue-500' },
                            ].map(({ Icon, href, hover }) => (
                                <a
                                    key={hover}
                                    href={href}
                                    className={`w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 transition-all duration-200 ${hover}`}
                                >
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="font-bold text-slate-300 mb-5 text-xs uppercase tracking-widest">Platform</h4>
                        <ul className="space-y-3">
                            {[
                                ['Email Verifier', '/email-verifier'],
                                ['Spam Checker', '/spam-checker'],
                                ['Email Warmup', '/tools/email-warmup'],
                                ['Drip Campaigns', '/tools/campaigns'],
                                ['All Tools', '/tools'],
                            ].map(([l, h]) => (
                                <li key={l}>
                                    <Link href={h} className="text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-200 transition-colors font-medium">{l}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-bold text-slate-300 mb-5 text-xs uppercase tracking-widest">Company</h4>
                        <ul className="space-y-3">
                            {[
                                ['About Us', '/about'],
                                ['Pricing', '/pricing'],
                                ['Blog', '/blog'],
                                ['Contact', '/contact'],
                                ['Integrations', '/integrations'],
                            ].map(([l, h]) => (
                                <li key={l}>
                                    <Link href={h} className="text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-200 transition-colors font-medium">{l}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-bold text-slate-300 mb-5 text-xs uppercase tracking-widest">Legal</h4>
                        <ul className="space-y-3">
                            {[
                                ['Terms of Service', '/terms'],
                                ['Privacy Policy', '/privacy'],
                                ['Cookie Policy', '#'],
                                ['GDPR', '#'],
                            ].map(([l, h]) => (
                                <li key={l}>
                                    <Link href={h} className="text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-200 transition-colors font-medium">{l}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-600 dark:text-zinc-400">© {new Date().getFullYear()} AuraSend. All rights reserved.</p>
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm text-slate-600 dark:text-zinc-400">All systems operational</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

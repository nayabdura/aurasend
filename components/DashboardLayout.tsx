'use client';

import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLocalStorage } from '@/lib/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Mail, Megaphone,
    BarChart3, Settings, LogOut, User, Shield,
    Menu, X, Users, Lightbulb, TestTube, BookOpen, Ban, Zap,
    Bot, MessageSquare, Moon, Sun,
    Target, Activity, CreditCard
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';

import CommandPalette from './CommandPalette';
import AIAgentWidget from './AIAgentWidget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading: loading } = useApp();
    const [sidebarOpen, setSidebarOpen] = useLocalStorage<boolean>('sidebarOpen', true);
    const [mobileOpen, setMobileOpen] = useState<boolean>(false);
    const [darkMode, setDarkMode] = useLocalStorage<boolean>('darkMode', false);

    const router = useRouter();
    const pathname = usePathname();

    // Auto-close mobile sidebar when navigating
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Sync dark mode class
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const toggleDarkMode = useCallback(() => {
        setDarkMode((prev) => !prev);
    }, [setDarkMode]);

    const handleLogout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/';
        } catch {
            // Ignore logout errors
        }
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent"
                />
            </div>
        );
    }

    const navItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', group: 'main' },
        { href: '/gmail', icon: Mail, label: 'Email Accounts', group: 'main' },
        { href: '/warmup', icon: Zap, label: 'Warmup Control', group: 'main' },
        { divider: true, label: 'Campaigns', group: 'campaign' },
        { href: '/campaigns', icon: Megaphone, label: 'Campaigns', group: 'campaign' },
        { href: '/contacts', icon: Users, label: 'Contacts', group: 'campaign' },
        { divider: true, label: 'Monitoring', group: 'monitor' },
        { href: '/conversations', icon: MessageSquare, label: 'Conversations', group: 'monitor' },
        { href: '/tracker', icon: Activity, label: 'Email Tracker', group: 'monitor' },
        { href: '/analytics', icon: BarChart3, label: 'Analytics', group: 'monitor' },
        { href: '/logs', icon: BookOpen, label: 'Send Logs', group: 'monitor' },
        { divider: true, label: 'Tools', group: 'tools' },
        { href: '/autopilot', icon: Bot, label: 'AI Autopilot', group: 'tools' },
        { href: '/leads', icon: Target, label: 'Leads & List', group: 'tools' },
        { href: '/training', icon: Lightbulb, label: 'AI Training', group: 'tools' },
        { href: '/blacklist', icon: Ban, label: 'Blacklist', group: 'tools' },
        { href: '/test', icon: TestTube, label: 'Testing Center', group: 'tools' },
        { href: '/settings', icon: Settings, label: 'Settings', group: 'tools' },
        { href: '/settings/billing', icon: CreditCard, label: 'Billing & Plan', group: 'tools' },
    ];

    const renderNavContent = (isMobile = false) => (
        <>
            {/* Logo Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-700/50 min-h-[72px]">
                <div className="flex items-center gap-2.5">
                    <a href="/dashboard" className="flex items-center gap-3 py-1 group/logo">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur opacity-20 group-hover/logo:opacity-50 transition duration-500"></div>
                            <Image src="/logo.png" alt="AuraSend" width={40} height={40} className="relative z-10 object-contain rounded-xl shadow-lg flex-shrink-0" />
                        </div>
                        {(isMobile || sidebarOpen) && (
                            <div className="flex flex-col">
                                <span className="font-extrabold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">AuraSend</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">System Online</span>
                                </div>
                            </div>
                        )}
                    </a>
                </div>
                {isMobile ? (
                    <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-gray-300">
                        <X size={20} />
                    </button>
                ) : (
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                )}
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                {navItems.map((item: any, idx) => {
                    if (item.divider) {
                        return (isMobile || sidebarOpen) ? (
                            <div key={idx} className="pt-3 pb-1 px-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{item.label}</p>
                            </div>
                        ) : <div key={idx} className="h-3" />;
                    }

                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.href}
                            onClick={() => {
                                router.push(item.href);
                                if (isMobile) setMobileOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group relative
                                ${isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-white/10'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            title={(!isMobile && !sidebarOpen) ? item.label : undefined}
                        >
                            <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:text-white'}`} />
                            {(isMobile || sidebarOpen) && (
                                <span className="font-medium text-sm whitespace-nowrap overflow-hidden">
                                    {item.label}
                                </span>
                            )}
                            {(!isMobile && !sidebarOpen && isActive) && (
                                <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-blue-400" />
                            )}
                        </button>
                    );
                })}

                {user?.role === 'master' && (
                    <>
                        {(isMobile || sidebarOpen) && <div className="pt-3 pb-1 px-3"><p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Admin</p></div>}
                        <button
                            onClick={() => {
                                router.push('/admin');
                                if (isMobile) setMobileOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${pathname === '/admin'
                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                                : 'text-purple-400 hover:bg-purple-900/30 hover:text-purple-200'}`}
                            title={(!isMobile && !sidebarOpen) ? 'Admin Panel' : undefined}
                        >
                            <Shield size={18} className="flex-shrink-0" />
                            {(isMobile || sidebarOpen) && <span className="font-medium text-sm">Admin Panel</span>}
                        </button>
                    </>
                )}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-gray-700/50 space-y-2">
                <button onClick={toggleDarkMode} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-all">
                    {darkMode ? <Sun size={18} className="flex-shrink-0" /> : <Moon size={18} className="flex-shrink-0" />}
                    {(isMobile || sidebarOpen) && <span className="text-sm font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>

                <div className={`flex items-center gap-3 px-3 py-2 ${(!isMobile && !sidebarOpen) ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                        <User size={14} />
                    </div>
                    {(isMobile || sidebarOpen) && (
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs text-white truncate">{user?.name || user?.email}</p>
                            <p className="text-[10px] text-gray-400 truncate capitalize">{user?.role}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-200 transition-all text-sm font-semibold ${(!isMobile && !sidebarOpen) ? 'justify-center' : ''}`}
                >
                    <LogOut size={16} className="flex-shrink-0" />
                    {(isMobile || sidebarOpen) && <span>Logout</span>}
                </button>
            </div>
        </>
    );

    return (
        <div className={`h-screen flex flex-col md:flex-row overflow-hidden ${darkMode ? 'bg-zinc-950 text-zinc-50' : 'bg-[#f8fafc] text-slate-900'}`}>
            <CommandPalette />

            {/* Mobile Header Bar */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0B0F19] text-white border-b border-gray-800 shrink-0 z-30">
                <div className="flex items-center gap-2.5">
                    <Image src="/logo.png" alt="AuraSend" width={32} height={32} className="object-contain rounded-lg" />
                    <span className="font-extrabold text-base tracking-tight text-white">AuraSend</span>
                </div>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    aria-label="Open navigation menu"
                >
                    <Menu size={20} />
                </button>
            </div>

            {/* Mobile Sidebar Off-canvas Drawer & Backdrop */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="md:hidden fixed inset-y-0 left-0 w-72 bg-[#0B0F19] text-white z-50 flex flex-col shadow-2xl border-r border-slate-800"
                        >
                            {renderNavContent(true)}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Collapsible Sidebar */}
            <motion.aside
                animate={{ width: sidebarOpen ? 256 : 72 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`hidden md:flex ${darkMode ? 'bg-[#09090b] border-white/5' : 'bg-[#0B0F19] border-slate-800'} text-white flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none border-r overflow-hidden flex-shrink-0 z-20`}
            >
                {renderNavContent(false)}
            </motion.aside>

            {/* Main Content */}
            <main className={`flex-1 overflow-auto ${darkMode ? 'bg-[#09090b] text-zinc-100' : 'bg-[#f8fafc] text-slate-900'} min-w-0 transition-colors duration-200`}>
                <div className="p-4 sm:p-6 md:p-8 max-w-screen-2xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Global AI Agent Component */}
            <AIAgentWidget />
        </div>
    );
}

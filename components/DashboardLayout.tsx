'use client';

import { useCallback, useEffect } from 'react';
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
    // Ph11: Use global SWR-backed AppContext — zero extra network calls
    const { user, isLoading: loading } = useApp();

    // Ph16: useLocalStorage for SSR-safe persistent prefs (replaces broken useState() side-effect)
    const [sidebarOpen, setSidebarOpen] = useLocalStorage<boolean>('sidebarOpen', true);
    const [darkMode, setDarkMode] = useLocalStorage<boolean>('darkMode', false);

    // Sync dark mode class on the document root whenever darkMode changes
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

    const router = useRouter();
    const pathname = usePathname();

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

    return (
        <div className={`h-screen flex overflow-hidden ${darkMode ? 'bg-zinc-950 text-zinc-50' : 'bg-[#f8fafc] text-slate-900'}`}>
            <CommandPalette />

            {/* Sidebar */}
            <motion.aside
                animate={{ width: sidebarOpen ? 256 : 72 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`${darkMode ? 'bg-[#09090b] border-white/5' : 'bg-[#0B0F19] border-slate-800'} text-white flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none border-r overflow-hidden flex-shrink-0 z-20`}
            >
                {/* Logo */}
                <div className="p-4 flex items-center justify-between border-b border-gray-700/50 min-h-[72px]">
                    <AnimatePresence>
                        {sidebarOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center gap-2.5"
                            >
                                <a href="/dashboard" className="flex items-center gap-3 py-1 group/logo">
                                    <div className="relative">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur opacity-20 group-hover/logo:opacity-50 transition duration-500"></div>
                                        <Image src="/logo.png" alt="AuraSend" width={40} height={40} className="relative z-10 object-contain rounded-xl shadow-lg flex-shrink-0" />
                                    </div>
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
                                </a>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                    >
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                    {navItems.map((item: any, idx) => {
                        if (item.divider) {
                            return sidebarOpen ? (
                                <div key={idx} className="pt-3 pb-1 px-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{item.label}</p>
                                </div>
                            ) : <div key={idx} className="h-3" />;
                        }

                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <motion.button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.97 }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group relative
                                    ${isActive
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-white/10'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                title={!sidebarOpen ? item.label : undefined}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 -z-10"
                                    />
                                )}
                                <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:text-white'}`} />
                                <AnimatePresence>
                                    {sidebarOpen && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.1 }}
                                            className="font-medium text-sm whitespace-nowrap overflow-hidden"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {/* Active dot for collapsed */}
                                {!sidebarOpen && isActive && (
                                    <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-blue-400" />
                                )}
                            </motion.button>
                        );
                    })}

                    {/* Admin Link */}
                    {user?.role === 'master' && (
                        <>
                            {sidebarOpen && <div className="pt-3 pb-1 px-3"><p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Admin</p></div>}
                            <motion.button
                                onClick={() => router.push('/admin')}
                                whileHover={{ x: 2 }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${pathname === '/admin'
                                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                                    : 'text-purple-400 hover:bg-purple-900/30 hover:text-purple-200'}`}
                                title={!sidebarOpen ? 'Admin Panel' : undefined}
                            >
                                <Shield size={18} className="flex-shrink-0" />
                                {sidebarOpen && <span className="font-medium text-sm">Admin Panel</span>}
                            </motion.button>
                        </>
                    )}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-gray-700/50 space-y-2">
                    {/* Dark mode toggle */}
                    <button onClick={toggleDarkMode} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-all" title={!sidebarOpen ? (darkMode ? 'Light Mode' : 'Dark Mode') : undefined}>
                        {darkMode ? <Sun size={18} className="flex-shrink-0" /> : <Moon size={18} className="flex-shrink-0" />}
                        {sidebarOpen && <span className="text-sm font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>

                    {/* User */}
                    <div className={`flex items-center gap-3 px-3 py-2 ${!sidebarOpen && 'justify-center'}`}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                            <User size={14} />
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs text-white truncate">{user?.name || user?.email}</p>
                                <p className="text-[10px] text-gray-400 truncate capitalize">{user?.role}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-200 transition-all text-sm font-semibold ${!sidebarOpen && 'justify-center'}`}
                        title={!sidebarOpen ? 'Logout' : undefined}
                    >
                        <LogOut size={16} className="flex-shrink-0" />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className={`flex-1 overflow-auto ${darkMode ? 'bg-[#09090b] text-zinc-100' : 'bg-[#f8fafc] text-slate-900'} min-w-0 transition-colors duration-200`}>
                <div className="p-6 md:p-8 max-w-screen-2xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Global AI Agent Component */}
            <AIAgentWidget />
        </div>
    );
}

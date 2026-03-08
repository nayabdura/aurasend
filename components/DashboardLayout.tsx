'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Mail, Megaphone, FileText,
    BarChart3, Settings, LogOut, User, Shield,
    Menu, X, Users, Lightbulb, TestTube, BookOpen, Ban, Zap, Magnet,
    Bot, Shield as ShieldIcon, MessageSquare, GitBranch, Moon, Sun,
    Target, Activity, CreditCard
} from 'lucide-react';
import CommandPalette from './CommandPalette';
import AIAgentWidget from './AIAgentWidget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebarOpen');
            if (saved !== null) setSidebarOpen(saved === 'true');
            const dm = localStorage.getItem('darkMode');
            if (dm === 'true') {
                setDarkMode(true);
                document.documentElement.classList.add('dark');
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarOpen', String(sidebarOpen));
        }
    }, [sidebarOpen]);

    function toggleDarkMode() {
        const next = !darkMode;
        setDarkMode(next);
        localStorage.setItem('darkMode', String(next));
        if (next) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => { fetchUser(); }, []);

    async function fetchUser() {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.user) setUser(data.user);
        } catch (e) {
            console.error('Failed to fetch user');
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (e) {
            console.error('Logout failed');
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
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
        <div className={`min-h-screen flex ${darkMode ? ' bg-gray-950' : 'bg-gray-50'}`}>
            <CommandPalette />

            {/* Sidebar */}
            <motion.aside
                animate={{ width: sidebarOpen ? 256 : 72 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gradient-to-b from-slate-900 to-gray-900'} text-white flex flex-col shadow-2xl border-r border-gray-800 overflow-hidden flex-shrink-0`}
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
                                <img src="/logo.png" alt="AuraSend" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-indigo-500/30 flex-shrink-0" />
                                <div>
                                    <span className="font-extrabold text-base tracking-tight">AuraSend</span>
                                    <div className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <span className="text-[10px] text-gray-400 font-medium">System Online</span>
                                    </div>
                                </div>
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
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                                        : 'text-gray-400 hover:text-white hover:bg-white/8'
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
                    <button
                        onClick={toggleDarkMode}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                        title={!sidebarOpen ? (darkMode ? 'Light Mode' : 'Dark Mode') : undefined}
                    >
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
                                <p className="text-[10px] text-gray-500 truncate capitalize">{user?.role}</p>
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
            <main className={`flex-1 overflow-auto ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} min-w-0`}>
                <div className="p-6 md:p-8 max-w-screen-2xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Global AI Agent Component */}
            <AIAgentWidget />
        </div>
    );
}

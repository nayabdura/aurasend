import Link from 'next/link';
import { LayoutDashboard, MessageSquare, PlayCircle, Users, Mail, BarChart3, Settings, Shield, TestTube, Lightbulb, BookOpen, FileText, Magnet } from 'lucide-react';

const Sidebar = () => {
    return (
        <div className="w-64 bg-zinc-950 border-r border-zinc-800 h-screen p-4 flex flex-col fixed left-0 top-0 text-white shadow-xl overflow-y-auto">
            <div className="mb-8 p-2">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tight font-outfit">
                    ColdMail.os
                </h1>
                <p className="text-xs text-zinc-500 mt-1">V2.0 • Local & Free</p>
            </div>

            <nav className="flex-1 space-y-1">
                <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
                <NavItem href="/conversations" icon={<MessageSquare size={18} />} label="Conversations" />

                <div className="pt-4 pb-1">
                    <p className="px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Growth</p>
                </div>
                <NavItem href="/campaigns" icon={<PlayCircle size={18} />} label="Campaigns" />
                <NavItem href="/leads" icon={<Users size={18} />} label="Audience" />

                <div className="pt-4 pb-1">
                    <p className="px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Infrastructure</p>
                </div>
                <NavItem href="/gmail" icon={<Mail size={18} />} label="Sender Accounts" />
                <NavItem href="/analytics" icon={<BarChart3 size={18} />} label="Analytics & Logs" />

                <div className="pt-4 pb-1">
                    <p className="px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Configuration</p>
                </div>
                <NavItem href="/settings" icon={<Settings size={18} />} label="Settings" />
            </nav>

            <div className="mt-auto p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                    <span className="font-medium text-zinc-300">System Online</span>
                </div>
                <p className="text-zinc-500">Local SQLite Mode</p>
            </div>
        </div>
    );
};

const NavItem = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => (
    <Link href={href} className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-zinc-800 transition-all duration-200 text-zinc-400 hover:text-zinc-50 group font-medium text-sm">
        <span className="text-zinc-500 group-hover:text-blue-400 transition-colors">
            {icon}
        </span>
        <span>{label}</span>
    </Link>
);

export default Sidebar;

'use client';
import { useState, useEffect } from 'react';
import { Save, Loader2, Settings as SettingsIcon, MessageSquare, Clock, Calendar, Zap } from 'lucide-react';
import SpamChecker from '@/components/SpamChecker';
import RichTextEditor from '@/components/RichTextEditor';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>({});
    const [scheduleSettings, setScheduleSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Load general settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => { setSettings(data); setLoading(false); })
            .catch(err => console.error(err));

        // Load schedule settings
        fetch('/api/schedule/config')
            .then(res => res.json())
            .then(data => setScheduleSettings(data))
            .catch(err => console.error(err));
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleScheduleChange = (key: string, value: string) => {
        setScheduleSettings((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save general settings
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            // Save schedule settings
            await fetch('/api/schedule/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scheduleSettings),
            });

            alert('✅ Settings saved successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-3">
                    <SettingsIcon className="text-slate-600 dark:text-zinc-50" /> Settings
                </h1>
                <div className="flex gap-3">
                    <button onClick={async () => {
                        if (!confirm('Send emails now? This will process the queue immediately.')) return;
                        try {
                            await fetch('/api/send/manual', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: 10 }) });
                            alert('✅ Sending 10 emails...');
                        } catch (e) {
                            alert('❌ Failed to send');
                        }
                    }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-95 shadow-lg">
                        <Zap size={18} /> Send Emails Now
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-95 shadow-lg disabled:opacity-50">
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save All Changes
                    </button>
                </div>
            </div>

            {/* ACCOUNT & SECURITY */}
            <div className="bg-white dark:bg-zinc-900/60 p-8 rounded-xl shadow-sm border border-red-100/50 space-y-6">
                <h2 className="text-xl font-semibold pb-2 border-b text-slate-800 dark:text-zinc-50 flex items-center gap-2">
                    <SettingsIcon size={20} className="text-slate-500 dark:text-zinc-50" /> Account & Security
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Update Password */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-slate-700 dark:text-zinc-50">Change Password</h3>
                        <div>
                            <label className="block text-sm text-slate-600 dark:text-zinc-50 mb-1">Current Password</label>
                            <input type="password" id="current_password" placeholder="••••••••" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 dark:text-zinc-50 mb-1">New Password</label>
                            <input type="password" id="new_password" placeholder="••••••••" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <button onClick={async () => {
                            const cur = (document.getElementById('current_password') as HTMLInputElement).value;
                            const nw = (document.getElementById('new_password') as HTMLInputElement).value;
                            if (!cur || !nw) return alert('Fill both password fields');
                            const res = await fetch('/api/auth/profile', {
                                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ currentPassword: cur, newPassword: nw })
                            });
                            const data = await res.json();
                            if (res.ok) {
                                alert('✅ ' + data.message);
                                (document.getElementById('current_password') as HTMLInputElement).value = '';
                                (document.getElementById('new_password') as HTMLInputElement).value = '';
                            } else {
                                alert('❌ ' + data.error);
                            }
                        }} className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors">
                            Update Password
                        </button>
                    </div>

                    {/* Delete Account */}
                    <div className="space-y-4 pt-1 md:pt-0">
                        <h3 className="font-medium text-red-600">Danger Zone</h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-400">Permanently delete your account, all connected campaigns, and data. This action cannot be undone.</p>
                        <div className="border border-red-200 bg-red-50 p-4 rounded-xl space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-red-800 mb-1">Verify Password to Delete</label>
                                <input type="password" id="delete_password" placeholder="Enter password" className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm bg-white dark:bg-zinc-900/60" />
                            </div>
                            <button onClick={async () => {
                                const pass = (document.getElementById('delete_password') as HTMLInputElement).value;
                                if (!pass) return alert('Enter your password to verify deletion');
                                if (!confirm('Are you absolutely sure you want to delete your account? ALL your data will be wiped.')) return;

                                const res = await fetch('/api/auth/profile', {
                                    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ currentPassword: pass })
                                });
                                const data = await res.json();
                                if (res.ok) {
                                    alert('✅ Account deleted. You will now be logged out.');
                                    window.location.href = '/';
                                } else {
                                    alert('❌ Failed: ' + data.error);
                                }
                            }} className="w-full px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors">
                                Permanently Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SCHEDULING & TIMING */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-xl shadow-sm border border-blue-100 space-y-6">
                <h2 className="text-xl font-semibold pb-2 border-b border-blue-200 text-slate-800 dark:text-zinc-50 flex items-center gap-2">
                    <Clock size={22} className="text-blue-600" /> Campaign Scheduling & Timing
                </h2>

                {/* Send Window */}
                <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-lg shadow-sm">
                    <h3 className="font-semibold text-slate-700 dark:text-zinc-50 mb-4 flex items-center gap-2">
                        <Zap size={18} className="text-orange-500" /> Daily Send Window
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-50 mb-2">Start Time</label>
                            <input type="time"
                                value={scheduleSettings.send_window_start || '09:00'}
                                onChange={(e) => handleScheduleChange('send_window_start', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-50 mb-2">End Time</label>
                            <input type="time"
                                value={scheduleSettings.send_window_end || '17:00'}
                                onChange={(e) => handleScheduleChange('send_window_end', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-50 mt-2">Emails will only be sent during this time window (local time).</p>
                </div>

                {/* Campaign Start Time */}
                <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-lg shadow-sm">
                    <h3 className="font-semibold text-slate-700 dark:text-zinc-50 mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-green-500" /> Campaign Start Time (Optional)
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-zinc-50 mb-2">Schedule Start Date & Time</label>
                        <input type="datetime-local"
                            value={scheduleSettings.campaign_start_at || ''}
                            onChange={(e) => handleScheduleChange('campaign_start_at', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        <p className="text-xs text-slate-500 dark:text-zinc-50 mt-2">Leave empty to start immediately when you click "Start Campaign". Otherwise, campaign will start at the specified time.</p>
                    </div>
                </div>

                {/* Follow-up Delays */}
                <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-lg shadow-sm">
                    <h3 className="font-semibold text-slate-700 dark:text-zinc-50 mb-4 flex items-center gap-2">
                        <MessageSquare size={18} className="text-purple-500" /> Follow-up Timing
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-50 mb-2">Follow-up #1 After (hours)</label>
                            <input type="number"
                                value={scheduleSettings.followup1_delay || '24'}
                                onChange={(e) => handleScheduleChange('followup1_delay', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="24" />
                            <p className="text-xs text-slate-500 dark:text-zinc-50 mt-1">Default: 24 hours (1 day)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-50 mb-2">Follow-up #2 After (hours)</label>
                            <input type="number"
                                value={scheduleSettings.followup2_delay || '48'}
                                onChange={(e) => handleScheduleChange('followup2_delay', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="48" />
                            <p className="text-xs text-slate-500 dark:text-zinc-50 mt-1">Default: 48 hours (2 days)</p>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            💡 <strong>How it works:</strong> If a lead doesn't reply after X hours from the initial send, the system will automatically send a follow-up.
                        </p>
                    </div>
                </div>
            </div>

            {/* SENDING LIMITS */}
            <div className="bg-white dark:bg-zinc-900/60 p-8 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 space-y-6">
                <h2 className="text-xl font-semibold pb-2 border-b text-slate-700 dark:text-zinc-50">Sending Limits & Delays</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-zinc-50 mb-2">Default Daily Limit per Account</label>
                        <input type="number"
                            value={settings.default_daily_limit || ''}
                            onChange={(e) => handleChange('default_daily_limit', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        <p className="text-xs text-slate-500 dark:text-zinc-50 mt-1">Recommended: 20-50 per day to warm up.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-50 mb-2">Min Delay (sec)</label>
                            <input type="number"
                                value={settings.delay_min || ''}
                                onChange={(e) => handleChange('delay_min', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-50 mb-2">Max Delay (sec)</label>
                            <input type="number"
                                value={settings.delay_max || ''}
                                onChange={(e) => handleChange('delay_max', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                    </div>
                </div>
            </div>

            {/* EMAIL TEMPLATES */}
            <div className="bg-white dark:bg-zinc-900/60 p-8 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800/80 dark:border-zinc-800/80 space-y-6">
                <h2 className="text-xl font-semibold pb-2 border-b text-slate-700 dark:text-zinc-50 flex items-center gap-2">
                    <MessageSquare size={20} className="text-purple-600" /> Email Templates
                </h2>

                <div className="space-y-6">
                    {/* Initial Email */}
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <h3 className="font-medium text-purple-900 mb-4">📧 Initial Email (Day 1)</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-50 mb-2">Subject Line</label>
                                <input type="text"
                                    value={settings.template_subject_1 || ''}
                                    onChange={(e) => handleChange('template_subject_1', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                    placeholder="e.g. Question about {{company}}" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-50 mb-2">Email Body</label>
                                <RichTextEditor
                                    value={settings.template_body_1 || ''}
                                    onChange={(val) => handleChange('template_body_1', val)}
                                    placeholder="Hi {{name}}, {{intro}}"
                                    height="300px"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Follow-up Templates */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h3 className="font-medium text-blue-900 mb-4">🔄 Follow-up (If Opened)</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-50 mb-2">Email Body</label>
                            <RichTextEditor
                                value={settings.template_followup_opened || ''}
                                onChange={(val) => handleChange('template_followup_opened', val)}
                                placeholder="Hi {{name}}, I noticed you opened my email..."
                                height="200px"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                        <h3 className="font-medium text-amber-900 mb-4">📭 Follow-up (If Not Opened)</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-50 mb-2">Email Body</label>
                            <RichTextEditor
                                value={settings.template_followup_unread || ''}
                                onChange={(val) => handleChange('template_followup_unread', val)}
                                placeholder="Hi {{name}}, just bumping this up..."
                                height="200px"
                            />
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-zinc-50 bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 p-3 rounded">
                        <strong>Variables:</strong> <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded mx-1">{'{{name}}'}</code>
                        <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded mx-1">{'{{company}}'}</code>
                        <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded mx-1">{'{{website}}'}</code>
                        <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded mx-1">{'{{intro}}'}</code> (random from training)
                    </p>

                    <SpamChecker
                        subject={settings.template_subject_1 || ''}
                        body={settings.template_body_1 || ''}
                    />
                </div>
            </div>
        </div>
    );
}

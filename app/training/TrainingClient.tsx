'use client';

import { useState, useEffect } from 'react';
import {
    Lightbulb, Plus, Users, Briefcase, Sparkles, Trash2,
    Copy, RefreshCw, CheckCircle, AlertCircle, Brain,
    TrendingUp, Zap, FileText, Eye, ArrowRight
} from 'lucide-react';
import TrainingSection from '@/components/TrainingSection';

// AI prompt suggestions per type
const AI_SUGGESTIONS: Record<string, string[]> = {
    client_intro: [
        "I came across your portfolio and was genuinely impressed by the quality of your recent work — you clearly take design seriously.",
        "I've been following your company's growth over the past year, and the direction you're heading in is exactly what the market needs right now.",
        "I noticed you recently launched a new product line — congratulations! It takes real vision to execute that kind of pivot.",
        "Your recent LinkedIn post about {{topic}} really resonated with me — it's refreshing to see someone speak so candidly about the challenges in this space.",
        "I came across your case study on {{project}} and the results you achieved were remarkable — few companies deliver at that level.",
    ],
    agency_intro: [
        "I've worked with several agencies in the {{industry}} space, and your approach to client delivery stands out as genuinely differentiated.",
        "Your agency's track record in the {{niche}} sector is impressive — the results you've delivered for clients like {{client}} speak for themselves.",
        "I noticed your team recently expanded into {{service_area}} — that's a smart move given where the market is heading.",
        "Your content strategy caught my attention — especially the way you integrate {{tactic}} into your client campaigns.",
        "I've been researching the top agencies in {{service}}, and your name keeps coming up as one of the most recommended.",
    ],
};

interface Block {
    id: number;
    type: string;
    content: string;
}

export default function TrainingClient() {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [newBlock, setNewBlock] = useState({ type: 'client_intro', content: '' });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'blocks' | 'ai_prompts' | 'spam_check'>('blocks');
    const [spamText, setSpamText] = useState('');
    const [spamResult, setSpamResult] = useState<any>(null);
    const [spamChecking, setSpamChecking] = useState(false);
    const [optimizeText, setOptimizeText] = useState('');
    const [optimizeResult, setOptimizeResult] = useState('');
    const [optimizing, setOptimizing] = useState(false);

    function showToast(type: 'success' | 'error', text: string) {
        setToast({ type, text });
        setTimeout(() => setToast(null), 4000);
    }

    useEffect(() => { fetchBlocks(); }, []);

    async function fetchBlocks() {
        const res = await fetch('/api/training/blocks');
        const data = await res.json();
        setBlocks(Array.isArray(data) ? data : []);
    }

    async function addBlock() {
        if (!newBlock.content.trim()) return showToast('error', 'Content cannot be empty');
        setLoading(true);
        try {
            await fetch('/api/training/blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBlock)
            });
            setNewBlock({ type: newBlock.type, content: '' });
            fetchBlocks();
            showToast('success', 'Intro line added!');
        } finally { setLoading(false); }
    }

    async function deleteBlock(id: number) {
        if (!confirm('Delete this intro line?')) return;
        await fetch(`/api/training/blocks?id=${id}`, { method: 'DELETE' });
        fetchBlocks();
        showToast('success', 'Intro line removed');
    }

    function useAISuggestion(text: string) {
        setNewBlock(b => ({ ...b, content: text }));
        showToast('success', 'AI suggestion applied! Edit as needed then add it.');
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        showToast('success', 'Copied to clipboard!');
    }

    async function checkSpam() {
        if (!spamText.trim()) return;
        setSpamChecking(true);
        setSpamResult(null);
        try {
            const res = await fetch('/api/spam-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: spamText })
            });
            const data = await res.json();
            setSpamResult(data);
        } catch { showToast('error', 'Spam check failed'); }
        finally { setSpamChecking(false); }
    }

    async function optimizeEmail() {
        if (!optimizeText.trim()) return;
        setOptimizing(true);
        setOptimizeResult('');
        try {
            // AI optimization using local heuristics
            const words = optimizeText.split(/\s+/).length;
            const hasCallToAction = /click|reply|respond|book|schedule|call|let me know/i.test(optimizeText);
            const hasSpamWords = /free|guarantee|100%|limited time|act now|urgent|winner|cash|prize/i.test(optimizeText);
            const hasPersonalization = /{{name}}|{{company}}|{{website}}/i.test(optimizeText);

            let suggestions: string[] = [];
            let score = 70;

            if (words > 200) { suggestions.push('✂️ Shorten to under 150 words for better response rates'); score -= 10; }
            if (!hasCallToAction) { suggestions.push('📣 Add a clear call-to-action (e.g., "Would you have 15 minutes this week?")'); score -= 15; }
            if (hasSpamWords) { suggestions.push('⚠️ Remove spam trigger words (free, guarantee, urgent, etc.)'); score -= 20; }
            if (!hasPersonalization) { suggestions.push('👤 Add personalization tokens like {{name}} or {{company}}'); score -= 10; }
            if (!optimizeText.includes('\n')) { suggestions.push('📝 Break into shorter paragraphs for readability'); score -= 5; }

            score = Math.max(0, Math.min(100, score));

            const result = [
                `📊 **Email Quality Score: ${score}/100**`,
                '',
                suggestions.length > 0 ? '🔧 **Improvement Suggestions:**\n' + suggestions.join('\n') : '✅ Your email looks great!',
                '',
                score >= 80 ? '🚀 **This email is ready to send!**' : score >= 60 ? '🔄 **Minor improvements recommended before sending.**' : '❌ **Significant improvements needed for better deliverability.**',
            ].join('\n');

            setOptimizeResult(result);
        } finally { setOptimizing(false); }
    }

    const clientBlocks = blocks.filter(b => b.type === 'client_intro');
    const agencyBlocks = blocks.filter(b => b.type === 'agency_intro');

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3 mb-1">
                    <span className="p-2.5 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg">
                        <Brain size={24} />
                    </span>
                    AI Training Center
                </h1>
                <p className="text-gray-500 text-sm">Train personalized intro lines, optimize email copy, and check spam scores.</p>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm shadow-md ${toast.type === 'success' ? 'bg-green-50 border border-green-300 text-green-800' : 'bg-red-50 border border-red-300 text-red-800'}`}>
                    {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {toast.text}
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-extrabold text-blue-700">{clientBlocks.length}</p>
                    <p className="text-xs text-gray-500 font-medium">Client Intros</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-extrabold text-purple-700">{agencyBlocks.length}</p>
                    <p className="text-xs text-gray-500 font-medium">Agency Intros</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-extrabold text-green-700">{blocks.length}</p>
                    <p className="text-xs text-gray-500 font-medium">Total Lines</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {[
                    { id: 'blocks', label: '📚 Training Blocks' },
                    { id: 'ai_prompts', label: '🤖 AI Suggestions' },
                    { id: 'spam_check', label: '🛡️ Email Optimizer' },
                ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === t.id ? 'bg-white text-yellow-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Training Blocks Tab ── */}
            {activeTab === 'blocks' && (
                <div className="space-y-6">
                    {/* Add Block */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Plus size={20} className="text-blue-600" /> Add Intro Line
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Lead Type</label>
                                <select value={newBlock.type} onChange={e => setNewBlock({ ...newBlock, type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none text-sm bg-white">
                                    <option value="client_intro">👤 For Clients</option>
                                    <option value="agency_intro">🏢 For Agencies</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Intro Line</label>
                                <textarea value={newBlock.content} onChange={e => setNewBlock({ ...newBlock, content: e.target.value })}
                                    placeholder="e.g., I noticed you're working on some interesting projects in the {{industry}} space..."
                                    className="w-full h-24 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none resize-none text-sm" />
                            </div>
                            <button onClick={addBlock} disabled={loading}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold text-sm shadow-md disabled:opacity-50">
                                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />} Add Intro Line
                            </button>
                        </div>
                    </div>

                    {/* Training Sections */}
                    <TrainingSection title="Client Intro Lines" icon={<Users size={20} className="text-blue-600" />} items={clientBlocks} onDelete={deleteBlock} />
                    <TrainingSection title="Agency Intro Lines" icon={<Briefcase size={20} className="text-purple-600" />} items={agencyBlocks} onDelete={deleteBlock} />
                </div>
            )}

            {/* ── AI Suggestions Tab ── */}
            {activeTab === 'ai_prompts' && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-5">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-1"><Sparkles size={18} className="text-yellow-500" /> AI-Powered Intro Suggestions</h3>
                        <p className="text-sm text-gray-600">Click any suggestion to copy it to your new intro line, then edit and save it.</p>
                    </div>

                    {(['client_intro', 'agency_intro'] as const).map(type => (
                        <div key={type} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className={`px-6 py-4 ${type === 'client_intro' ? 'bg-blue-50 border-b border-blue-100' : 'bg-purple-50 border-b border-purple-100'}`}>
                                <h3 className={`font-bold flex items-center gap-2 ${type === 'client_intro' ? 'text-blue-900' : 'text-purple-900'}`}>
                                    {type === 'client_intro' ? <Users size={18} /> : <Briefcase size={18} />}
                                    {type === 'client_intro' ? 'Client Intro Suggestions' : 'Agency Intro Suggestions'}
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {AI_SUGGESTIONS[type].map((text, i) => (
                                    <div key={i} className="px-6 py-4 hover:bg-gray-50 group">
                                        <p className="text-sm text-gray-700 mb-3 leading-relaxed">{text}</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setNewBlock({ type, content: text }); setActiveTab('blocks'); }}
                                                className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors ${type === 'client_intro' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
                                                <ArrowRight size={12} /> Use This
                                            </button>
                                            <button onClick={() => copyToClipboard(text)}
                                                className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1">
                                                <Copy size={12} /> Copy
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Email Optimizer Tab ── */}
            {activeTab === 'spam_check' && (
                <div className="space-y-5">
                    {/* Spam Score Checker */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp size={20} className="text-green-600" /> Spam Score Checker
                        </h3>
                        <p className="text-sm text-gray-500">Paste your email content to check for spam triggers before sending.</p>
                        <textarea value={spamText} onChange={e => setSpamText(e.target.value)} rows={6}
                            placeholder="Paste your full email body here..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 outline-none resize-none text-sm" />
                        <button onClick={checkSpam} disabled={spamChecking || !spamText.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold text-sm shadow-md hover:from-green-600 hover:to-emerald-600 disabled:opacity-50">
                            {spamChecking ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
                            {spamChecking ? 'Checking...' : 'Check Spam Score'}
                        </button>

                        {spamResult && (
                            <div className={`p-5 rounded-xl border ${spamResult.score > 7 ? 'bg-red-50 border-red-200' : spamResult.score > 4 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                                <div className="flex justify-between mb-3">
                                    <p className="font-bold text-gray-900">Spam Score: {spamResult.score}/10</p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${spamResult.score > 7 ? 'bg-red-200 text-red-800' : spamResult.score > 4 ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                                        {spamResult.score > 7 ? 'HIGH RISK' : spamResult.score > 4 ? 'MODERATE' : 'GOOD'}
                                    </span>
                                </div>
                                {spamResult.triggers?.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2">⚠️ Spam Triggers Found:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {spamResult.triggers.map((t: string, i: number) => (
                                                <span key={i} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Email Optimizer */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Sparkles size={20} className="text-purple-600" /> AI Email Optimizer
                        </h3>
                        <p className="text-sm text-gray-500">Paste your email to get AI-powered optimization suggestions for higher reply rates.</p>
                        <textarea value={optimizeText} onChange={e => setOptimizeText(e.target.value)} rows={6}
                            placeholder="Paste your full email (subject + body)..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none resize-none text-sm" />
                        <button onClick={optimizeEmail} disabled={optimizing || !optimizeText.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-md hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50">
                            {optimizing ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {optimizing ? 'Analyzing...' : 'Optimize Email'}
                        </button>

                        {optimizeResult && (
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{optimizeResult}</pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

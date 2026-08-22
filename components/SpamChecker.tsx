'use client';
import { useState } from 'react';
import { Shield, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function SpamChecker({ subject, body }: { subject: string; body: string }) {
    const [result, setResult] = useState<any>(null);
    const [checking, setChecking] = useState(false);

    async function check() {
        setChecking(true);
        try {
            const res = await fetch('/api/spam-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, body })
            });
            const data = await res.json();
            setResult(data);
        } catch (e) {
            console.error(e);
        } finally {
            setChecking(false);
        }
    }

    const colorMap: any = {
        green: {
            bg: 'bg-gradient-to-br from-green-50 to-emerald-100',
            border: 'border-green-300',
            text: 'text-green-800',
            badge: 'bg-green-500'
        },
        blue: {
            bg: 'bg-gradient-to-br from-blue-50 to-cyan-100',
            border: 'border-blue-300',
            text: 'text-blue-800',
            badge: 'bg-blue-500'
        },
        yellow: {
            bg: 'bg-gradient-to-br from-yellow-50 to-amber-100',
            border: 'border-yellow-400',
            text: 'text-yellow-900',
            badge: 'bg-yellow-500'
        },
        orange: {
            bg: 'bg-gradient-to-br from-orange-50 to-red-100',
            border: 'border-orange-400',
            text: 'text-orange-900',
            badge: 'bg-orange-500'
        },
        red: {
            bg: 'bg-gradient-to-br from-red-50 to-pink-100',
            border: 'border-red-400',
            text: 'text-red-900',
            badge: 'bg-red-600'
        }
    };

    const getIcon = () => {
        if (!result) return <Shield size={20} />;
        if (result.score === 0) return <CheckCircle size={20} className="text-green-600" />;
        if (result.score < 30) return <Shield size={20} className="text-blue-600" />;
        if (result.score < 50) return <AlertTriangle size={20} className="text-yellow-600" />;
        return <XCircle size={20} className="text-red-600" />;
    };

    return (
        <div className="mt-6 p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 rounded-2xl border-2 border-purple-300 shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-3">
                    {getIcon()} Advanced Spam & Deliverability Analyzer
                </h3>
                <span className="text-xs bg-purple-200 text-purple-800 px-3 py-1 rounded-full font-semibold">
                    AI-Powered • 100% Free
                </span>
            </div>

            <button onClick={check} disabled={checking || !subject || !body}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] font-semibold text-lg">
                {checking ? (
                    <><Loader2 className="animate-spin" size={24} /> Analyzing Email...</>
                ) : (
                    <><Shield size={24} /> Run Complete Spam Analysis</>
                )}
            </button>

            {result && (
                <div className="space-y-6">
                    {/* Score Card */}
                    {(() => {
                        const level = result.rating.level.toLowerCase();
                        const theme = colorMap[level] || colorMap[result.rating.color] || colorMap.red; // Fallback

                        return (
                            <div className={`p-6 rounded-xl border-2 ${theme.bg} ${theme.border} shadow-lg`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-4xl">{result.rating.emoji}</span>
                                            <span className={`text-3xl font-bold ${theme.text}`}>{result.rating.level}</span>
                                        </div>
                                        <p className={`text-sm font-medium ${theme.text}`}>{theme.advice}</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="relative w-32 h-32">
                                            <svg className="transform -rotate-90 w-32 h-32">
                                                <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                                <circle
                                                    cx="64"
                                                    cy="64"
                                                    r="56"
                                                    stroke={theme.badge.replace('bg-', 'stroke-')} // Hacky but works if tailwind class exists or use style
                                                    className={theme.text.replace('text-', 'stroke-')} // Better alternative
                                                    strokeWidth="8"
                                                    fill="none"
                                                    strokeDasharray={`${((100 - result.score) / 100) * 351.86} 351.86`}
                                                    strokeLinecap="round"
                                                    style={{ stroke: theme.text === 'text-green-800' ? '#22c55e' : theme.text === 'text-blue-800' ? '#3b82f6' : theme.text === 'text-yellow-900' ? '#eab308' : '#ef4444' }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-3xl font-bold text-slate-800 dark:text-zinc-50">{100 - result.score}</span>
                                                <span className="text-xs text-slate-500 dark:text-zinc-50">Safety</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-300 dark:border-zinc-700">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-slate-800 dark:text-zinc-50">{result.score}</p>
                                        <p className="text-xs text-slate-600 dark:text-zinc-50">Spam Score</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-slate-800 dark:text-zinc-50">{result.flags.length}</p>
                                        <p className="text-xs text-slate-600 dark:text-zinc-50">Issues Found</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Flags List */}
                    {result.flags.length > 0 ? (
                        <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-xl shadow-md border border-slate-200 dark:border-zinc-800 dark:border-zinc-800">
                            <h4 className="font-semibold text-slate-800 dark:text-zinc-50 mb-4 flex items-center gap-2">
                                <AlertTriangle size={18} className="text-orange-500" /> Detailed Issues ({result.flags.length})
                            </h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {result.flags.map((flag: string, i: number) => {
                                    const isHighRisk = flag.includes('🚨');
                                    const isMediumRisk = flag.includes('⚠️');

                                    return (
                                        <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 ${isHighRisk ? 'bg-red-50 border-red-300' :
                                            isMediumRisk ? 'bg-yellow-50 border-yellow-300' :
                                                'bg-blue-50 border-blue-200'
                                            }`}>
                                            <span className="text-lg">{flag.split(' ')[0]}</span>
                                            <p className="text-sm flex-1">{flag.substring(flag.indexOf(' ') + 1)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-green-50 p-6 rounded-xl border border-green-300 text-center">
                            <CheckCircle size={48} className="mx-auto mb-3 text-green-600" />
                            <p className="text-lg font-semibold text-green-800">Perfect! No spam flags detected</p>
                            <p className="text-sm text-green-600 mt-1">Your email is ready to send with excellent deliverability</p>
                        </div>
                    )}
                </div>
            )}

            {!result && (
                <div className="text-center py-8 text-slate-500 dark:text-zinc-50 bg-white dark:bg-zinc-900/60 rounded-xl shadow-inner">
                    <Shield size={48} className="mx-auto mb-3 text-purple-400" />
                    <p className="font-medium">Click "Run Analysis" to check your email for:</p>
                    <ul className="text-sm mt-3 space-y-1 text-left max-w-md mx-auto">
                        <li>✓ High-risk spam trigger words</li>
                        <li>✓ Subject line optimization</li>
                        <li>✓ URL & link analysis</li>
                        <li>✓ Personalization score</li>
                        <li>✓ Formatting & readability</li>
                        <li>✓ Overall deliverability rating</li>
                    </ul>
                </div>
            )}
        </div>
    );
}

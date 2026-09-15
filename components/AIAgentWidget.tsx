'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import Link from 'next/link';

export default function AIAgentWidget() {
    const [open, setOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; time: string }[]>([
        { role: 'ai', text: 'Hi! I am your AI Platform Agent. How can I help you automate outreach, draft templates, or check deliverability today?', time: new Date().toLocaleTimeString() }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, open, minimized]);

    async function handleSend() {
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg, time: new Date().toLocaleTimeString() }]);
        setLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg }),
            });

            const data = await res.json();
            const replyText = data.reply || "I'm here to help manage your campaigns and email deliverability. What would you like to build?";

            setMessages(prev => [...prev, {
                role: 'ai',
                text: replyText,
                time: new Date().toLocaleTimeString()
            }]);
        } catch (e) {
            setMessages(prev => [...prev, {
                role: 'ai',
                text: "I'm having trouble connecting right now. Please check your network or try again in a moment.",
                time: new Date().toLocaleTimeString()
            }]);
        } finally {
            setLoading(false);
        }
    }

    function renderFormattedText(text: string) {
        // Simple helper to parse [Label](/url) links into clickable Next.js Links
        const parts = text.split(/(\[[^\]]+\]\(\/[^)]+\))/g);
        return parts.map((part, i) => {
            const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (match) {
                return (
                    <Link
                        key={i}
                        href={match[2]}
                        className="text-indigo-600 dark:text-indigo-400 font-bold underline hover:text-indigo-800"
                    >
                        {match[1]}
                    </Link>
                );
            }
            return <span key={i}>{part}</span>;
        });
    }

    if (!open) {
        return (
            <button
                onClick={() => { setOpen(true); setMinimized(false); }}
                className="fixed bottom-6 right-6 p-4 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-2xl rounded-full text-white transition-all hover:scale-105 z-50 flex items-center justify-center group"
                aria-label="Open AI Assistant Chat"
            >
                <Bot size={28} />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
            </button>
        );
    }

    if (minimized) {
        return (
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 transition-all animate-in slide-in-from-bottom-5">
                <button
                    onClick={() => setMinimized(false)}
                    className="p-3 bg-white dark:bg-zinc-900 shadow-xl rounded-full text-indigo-600 border border-slate-200 dark:border-zinc-800 hover:bg-indigo-50 transition-colors flex items-center gap-2"
                >
                    <Bot size={20} />
                    <span className="font-bold text-sm pr-2">AI Agent active</span>
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 shrink-0 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-base leading-tight">AI Platform Agent</h3>
                        <p className="text-xs text-indigo-100 font-medium tracking-wide flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Online (Gemini AI)
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setMinimized(true)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><Minimize2 size={16} /></button>
                    <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X size={18} /></button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-zinc-950 space-y-4">
                {messages.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.role === 'ai' ? 'items-start' : 'items-end'}`}>
                        <div className={`shadow-sm px-4 py-3 max-w-[85%] text-sm rounded-2xl ${m.role === 'ai'
                                ? 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-tl-sm whitespace-pre-wrap'
                                : 'bg-indigo-600 text-white rounded-tr-sm'
                            }`}>
                            {m.role === 'ai' ? renderFormattedText(m.text) : m.text}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1">{m.time}</span>
                    </div>
                ))}
                {loading && (
                    <div className="flex items-start">
                        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-indigo-600" />
                            <span className="text-xs text-slate-500 font-medium">AI is thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 shrink-0">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="relative flex items-center"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask the AI agent..."
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </form>
                <div className="mt-2 text-center flex items-center justify-center gap-1 opacity-60">
                    <Sparkles size={10} className="text-purple-600" />
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">AI handles campaigns, templates, deliverability, and automation</span>
                </div>
            </div>
        </div>
    );
}

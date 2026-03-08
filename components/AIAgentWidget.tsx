'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';

export default function AIAgentWidget() {
    const [open, setOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; time: string }[]>([
        { role: 'ai', text: 'Hi! I am your AI Assistant. What can I help you automate or understand today?', time: new Date().toLocaleTimeString() }
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
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg, time: new Date().toLocaleTimeString() }]);
        setLoading(true);

        try {
            // Simulated AI processing
            await new Promise(r => setTimeout(r, 1500));
            // You can replace this later with a call to an OpenAI API or your backend
            setMessages(prev => [...prev, {
                role: 'ai',
                text: "I am ready to help you manage your cold email campaigns across the platform. Currently, I'm analyzing your request—let me know if you need to run Autopilot, draft templates, or review deliverability!",
                time: new Date().toLocaleTimeString()
            }]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    if (!open) {
        return (
            <button
                onClick={() => { setOpen(true); setMinimized(false); }}
                className="fixed bottom-6 right-6 p-4 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-2xl rounded-full text-white transition-all hover:scale-105 z-50 flex items-center justify-center group"
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
                    className="p-3 bg-white shadow-xl rounded-full text-indigo-600 border border-gray-100 hover:bg-indigo-50 transition-colors flex items-center gap-2"
                >
                    <Bot size={20} />
                    <span className="font-bold text-sm pr-2">AI Agent active</span>
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 shrink-0 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-base leading-tight">AI Platform Agent</h3>
                        <p className="text-xs text-indigo-100 font-medium tracking-wide flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setMinimized(true)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><Minimize2 size={16} /></button>
                    <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X size={18} /></button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
                {messages.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.role === 'ai' ? 'items-start' : 'items-end'}`}>
                        <div className={`shadow-sm px-4 py-3 max-w-[85%] text-sm rounded-2xl ${m.role === 'ai'
                                ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                                : 'bg-indigo-600 text-white rounded-tr-sm'
                            }`}>
                            {m.text}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1">{m.time}</span>
                    </div>
                ))}
                {loading && (
                    <div className="flex items-start">
                        <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="relative flex items-center"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask the AI agent..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400"
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
                    <span className="text-[10px] text-gray-500 font-medium">AI handles campaigns, templates, and analytics</span>
                </div>
            </div>
        </div>
    );
}

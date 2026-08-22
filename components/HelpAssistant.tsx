'use client';

import { useState } from 'react';
import { HelpCircle, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';

export default function HelpAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ from: 'bot' | 'user', text: string }[]>([
        { from: 'bot', text: 'Hi! I can help you with your campaign. Select a topic below.' }
    ]);

    const options = [
        { label: 'How to start campaign?', answer: '1. Connect Gmail in "Gmail Accounts".\n2. Upload CSV in "Leads".\n3. Go to "Campaigns" and click Start.\n\nMake sure your daily limits are set!' },
        { label: 'Why emails not sending?', answer: 'Check:\n- Is campaign status "Running"?\n- Are you within the send window (9-5)?\n- Do you have daily limit remaining?\n- Is Gmail connected (Green Check)?' },
        { label: 'How to connect Gmail?', answer: 'Go to Gmail Accounts page, click "Connect New", use your Google Cloud Client ID/Secret. Then click "Connect Gmail" on the card to log in.' }
    ];

    function ask(option: { label: string, answer: string }) {
        setMessages(prev => [
            ...prev,
            { from: 'user', text: option.label },
            { from: 'bot', text: option.answer }
        ]);
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="bg-white dark:bg-zinc-900/60 w-80 shadow-2xl rounded-2xl border border-slate-200 dark:border-zinc-800 dark:border-zinc-800 overflow-hidden mb-4 animate-in slide-in-from-bottom-5">
                    <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2"><HelpCircle size={18} /> Helper Bot</h3>
                        <button onClick={() => setIsOpen(false)}><ChevronDown size={18} /></button>
                    </div>

                    <div className="h-64 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-wrap ${m.from === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-zinc-900/60 border text-slate-800 dark:text-zinc-50 rounded-bl-none shadow-sm'}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-2 bg-slate-100 dark:bg-zinc-800/50 dark:bg-zinc-800/50 border-t grid gap-2">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => ask(opt)} className="text-left text-xs bg-white dark:bg-zinc-900/60 hover:bg-blue-50 p-2 rounded border border-slate-200 dark:border-zinc-800 dark:border-zinc-800 transition-colors text-blue-700 font-medium">
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
                {isOpen ? <ChevronDown /> : <MessageSquare />}
                {!isOpen && <span className="font-semibold pr-2">Need Help?</span>}
            </button>
        </div>
    );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Send, CheckCircle2, MapPin, Clock, MessageSquareHeart } from 'lucide-react';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        // Simulate sending
        await new Promise(r => setTimeout(r, 1000));
        setSent(true);
        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <MarketingNav active="/contact" />

            <main className="pt-32 pb-24 relative overflow-hidden">
                <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-5 gap-16 lg:gap-24">
                        {/* Left column — info */}
                        <div className="lg:col-span-2 flex flex-col justify-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold tracking-wide shadow-sm mb-6 w-fit">
                                <MessageSquareHeart size={16} /> Contact Us
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-5 leading-tight">
                                Let's talk about <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
                                    your growth.
                                </span>
                            </h1>
                            <p className="text-lg text-slate-500 mb-12 leading-relaxed font-medium">
                                Have a question, feedback, or need help scaling your account? We're here for you and respond to every single message.
                            </p>

                            <div className="space-y-8">
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                                        <Mail size={24} />
                                    </div>
                                    <div className="pt-1">
                                        <p className="font-bold text-slate-900 mb-1">Email Support</p>
                                        <p className="text-base text-slate-500 font-medium">support@aurasend.co</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center shrink-0">
                                        <Clock size={24} />
                                    </div>
                                    <div className="pt-1">
                                        <p className="font-bold text-slate-900 mb-1">Guaranteed Response Time</p>
                                        <p className="text-base text-slate-500 font-medium">Within 24 hours, Mon–Fri</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                                        <MapPin size={24} />
                                    </div>
                                    <div className="pt-1">
                                        <p className="font-bold text-slate-900 mb-1">Global Headquarters</p>
                                        <p className="text-base text-slate-500 font-medium">Lahore, Pakistan</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right column — form */}
                        <div className="lg:col-span-3">
                            <div className="bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden">
                                {/* Decorative blur behind form */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent blur-3xl opacity-50 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                                {sent ? (
                                    <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center relative z-10">
                                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8 border-4 border-emerald-100">
                                            <CheckCircle2 className="text-emerald-500" size={48} />
                                        </div>
                                        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Message Received!</h2>
                                        <p className="text-lg text-slate-500 font-medium mb-10 max-w-sm mx-auto">Thank you for reaching out. A real human from our team will get back to you shortly.</p>
                                        <button
                                            onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                                            className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors shadow-sm"
                                        >
                                            Send another message
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                        <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Drop us a line</h2>
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={form.name}
                                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                                    className="w-full h-14 px-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white"
                                                    placeholder="John Smith"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Work Email</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={form.email}
                                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                                    className="w-full h-14 px-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white"
                                                    placeholder="you@company.com"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                                            <input
                                                type="text"
                                                required
                                                value={form.subject}
                                                onChange={e => setForm({ ...form, subject: e.target.value })}
                                                className="w-full h-14 px-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white"
                                                placeholder="How can we help you scale?"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                                            <textarea
                                                required
                                                rows={6}
                                                value={form.message}
                                                onChange={e => setForm({ ...form, message: e.target.value })}
                                                className="w-full p-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none text-slate-900 bg-slate-50 focus:bg-white"
                                                placeholder="Please provide as much detail as possible..."
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full h-16 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-70 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1"
                                        >
                                            {loading ? (
                                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>Send Message <Send size={20} /></>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}

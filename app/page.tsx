import Link from 'next/link';
import { ArrowRight, Zap, Target, Search, CheckCircle2, Globe2, Mail, Shield, Users, Inbox, Star, TrendingUp, CheckCircle, SearchCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';

export const metadata: Metadata = {
  title: 'AuraSend — Professional Cold Email & Outreach Automation',
  description: 'The complete outreach platform. Connect unlimited inboxes, warm them up automatically, and run intelligent campaigns with full analytics. No spam folders.',
  keywords: 'cold email, email automation, B2B outreach, email warmup, campaign management, lead generation',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-200">
      <MarketingNav />

      <main className="pt-20">
        {/* Schema JSON-LD for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'AuraSend',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Any',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              description: 'The complete B2B outreach automation platform.',
              url: 'https://aurasend.com',
            }),
          }}
        />

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white pt-28 pb-20">
          {/* Soft gradient blobs - subtle, not overwhelming */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-100 to-purple-50 rounded-full blur-3xl opacity-70" />
            <div className="absolute top-[60%] -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-60" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              {/* Left: Copy */}
              <div className="flex-1 text-center lg:text-left max-w-xl">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold mb-8">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                  </span>
                  The #1 All-in-One Cold Outreach Platform
                </div>

                <h1 className="text-5xl md:text-[64px] font-black tracking-tight text-slate-900 leading-[1.05] mb-7">
                  Send smarter.<br />
                  Close <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">faster.</span>
                    <span className="absolute bottom-1 left-0 right-0 h-3 bg-indigo-100 rounded-full -z-0" />
                  </span>
                </h1>

                <p className="text-xl text-slate-500 mb-10 leading-relaxed font-medium">
                  Verify emails, warm up inboxes, build drip sequences, and manage a full sales pipeline — all from AuraSend's unified dashboard.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                  <Link href="/login" className="w-full sm:w-auto inline-flex justify-center items-center gap-2 h-14 px-10 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-full font-bold text-lg transition-all shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 transform hover:-translate-y-0.5">
                    Start for Free <ArrowRight size={20} />
                  </Link>
                  <Link href="/tools" className="w-full sm:w-auto inline-flex justify-center items-center gap-2 h-14 px-10 bg-slate-50 border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 rounded-full font-bold text-lg transition-all hover:bg-white">
                    Explore Tools
                  </Link>
                </div>

                {/* Trust signals */}
                <div className="flex items-center justify-center lg:justify-start gap-6 text-sm font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> No credit card</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> Free forever plan</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> Instant setup</span>
                </div>
              </div>

              {/* Right: Dashboard Mockup Cards */}
              <div className="flex-1 w-full relative min-h-[480px] hidden lg:block">
                {/* Main card */}
                <div className="absolute top-0 right-0 w-[90%] bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-20">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    <span className="ml-3 text-xs text-slate-400 font-mono">AuraSend Dashboard</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Emails Sent', val: '12,450', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                      { label: 'Open Rate', val: '64.2%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { label: 'Replies', val: '847', color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map((s) => (
                      <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                        <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Mini email list */}
                  <div className="space-y-2">
                    {[
                      { name: 'Sarah Johnson', co: 'Acme Corp', status: '✓ Replied', sc: 'text-emerald-600' },
                      { name: 'David Kim', co: 'TechFlow', status: '◉ Opened', sc: 'text-blue-600' },
                      { name: 'Emma Davis', co: 'Growify', status: '→ Sent', sc: 'text-slate-500' },
                    ].map((l) => (
                      <div key={l.name} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{l.name}</p>
                          <p className="text-xs text-slate-400">{l.co}</p>
                        </div>
                        <span className={`text-xs font-bold ${l.sc}`}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating badge - Warmup */}
                <div className="absolute bottom-20 -left-4 z-30 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-52">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                      <Shield size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Inbox Warmup</p>
                      <p className="text-xs text-slate-500">Day 14 of 30</p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[47%] bg-purple-500 rounded-full" />
                  </div>
                  <p className="text-xs text-emerald-600 font-bold mt-2">✓ 98% inbox rate</p>
                </div>

                {/* Floating badge - Verified */}
                <div className="absolute -bottom-4 right-8 z-30 bg-emerald-600 text-white rounded-2xl shadow-xl p-4 w-52">
                  <p className="text-xs font-bold mb-1">Email Verified ✓</p>
                  <p className="text-sm font-black">sarah@acme.com</p>
                  <p className="text-emerald-200 text-xs mt-1">99 / 100 — Valid</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Tool Sections (Snov.io Style) */}

        {/* Tool 1: Email Verifier */}
        <section className="py-24 bg-white overflow-hidden border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 font-bold text-sm mb-6">
                  <SearchCheck size={16} /> Email Verifier
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-6 leading-tight">
                  Clean your email list to <span className="text-blue-600">reduce bounce rates to zero.</span>
                </h2>
                <p className="text-lg text-slate-500 mb-8 leading-relaxed font-medium">
                  AuraSend’s Email Verifier runs a comprehensive 7-tier check to validate every email on your list. We check syntax, domain health, MX records, and perform an invisible ping to the server to ensure the inbox actually exists. Catchall emails, disposable addresses, and spam traps are instantly filtered out. Keep your reputation spotless and your delivery high.
                </p>
                <ul className="space-y-4 mb-8">
                  {['Syntax and formatting check', 'Domain and MX record verification', 'Catch-all and disposable email detection', 'Real-time SMTP server pinging'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 font-semibold">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><CheckCircle size={14} /></div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/email-verifier" className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2 text-lg">
                  Try Email Verifier for free <ArrowRight size={20} />
                </Link>
              </div>
              <div className="flex-1 w-full relative">
                <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-xl relative z-10">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                    <span className="font-bold text-slate-900">List Verification Result</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">Completed</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-slate-700">Valid Emails</span>
                      </div>
                      <span className="font-black text-slate-900">8,402</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="font-semibold text-slate-700">Invalid & Bounces</span>
                      </div>
                      <span className="font-black text-slate-900">1,240</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="font-semibold text-slate-700">Catch-Alls</span>
                      </div>
                      <span className="font-black text-slate-900">358</span>
                    </div>
                  </div>
                </div>
                {/* Decorative blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-100/50 blur-3xl rounded-full -z-10" />
              </div>
            </div>
          </div>
        </section>

        {/* Tool 2: Drip Campaigns */}
        <section className="py-24 bg-slate-50 overflow-hidden border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm mb-6">
                  <Zap size={16} /> Drip Campaigns
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-6 leading-tight">
                  Automate follow-ups and scale <span className="text-indigo-600">personalized outreach.</span>
                </h2>
                <p className="text-lg text-slate-500 mb-8 leading-relaxed font-medium">
                  Stop sending emails manually. AuraSend’s Drip Campaign builder lets you construct multi-touch email sequences that map to your sales cycle. Use A/B testing to find the perfect subject line, insert dynamic spintax, and add smart delays. Our system automatically stops sending to a prospect the second they reply.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <Star className="text-indigo-500 mb-2" size={24} />
                    <h4 className="font-bold text-slate-900 mb-1">Advanced Variables</h4>
                    <p className="text-sm text-slate-500">Insert custom fields for deep personalization.</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <TrendingUp className="text-indigo-500 mb-2" size={24} />
                    <h4 className="font-bold text-slate-900 mb-1">A/B Testing</h4>
                    <p className="text-sm text-slate-500">Test different variants for optimal open rates.</p>
                  </div>
                </div>
                <Link href="/features" className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2 text-lg">
                  Explore Campaign Features <ArrowRight size={20} />
                </Link>
              </div>
              <div className="flex-1 w-full relative">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl relative z-10">
                  <div className="space-y-3">
                    {/* Mock Sequence Node 1 */}
                    <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-4 flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">1</div>
                      <div>
                        <h4 className="font-bold text-slate-900">Initial Email Sent</h4>
                        <p className="text-sm text-slate-500 mb-2">Wait for 3 days after sending.</p>
                        <div className="text-xs font-bold text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">65% Opened</div>
                      </div>
                    </div>
                    {/* Arrow Line */}
                    <div className="flex justify-center"><div className="w-0.5 h-6 bg-slate-300" /></div>
                    {/* Mock Sequence Node 2 */}
                    <div className="border border-slate-200 rounded-xl p-4 flex gap-4 bg-white">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold">2</div>
                      <div>
                        <h4 className="font-bold text-slate-900">Follow-up: Unopened</h4>
                        <p className="text-sm text-slate-500">Subject: Just following up on my previous note.</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorative blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-100/50 blur-3xl rounded-full -z-10" />
              </div>
            </div>
          </div>
        </section>

        {/* Tool 3: Inbox Warmup */}
        <section className="py-24 bg-white overflow-hidden border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 font-bold text-sm mb-6">
                  <Shield size={16} /> Inbox Warm-up
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-6 leading-tight">
                  Never land in the <span className="text-purple-600">spam folder</span> again.
                </h2>
                <p className="text-lg text-slate-500 mb-8 leading-relaxed font-medium">
                  Don't let your carefully crafted emails end up in spam. AuraSend’s warm-up tool integrates your sending accounts into an elite network of high-reputation inboxes. Our system automatically mimics human behavior: sending, opening, marking as important, reading, and replying to emails. It builds your domain trust with Google and Outlook silently in the background.
                </p>
                <ul className="space-y-4 mb-8">
                  {['Peer-to-peer network sending', 'Automated replies and engagement', 'Removal from spam folders', 'Detailed deliverability health-checks'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 font-semibold">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0"><CheckCircle size={14} /></div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/features" className="font-bold text-purple-600 hover:text-purple-700 flex items-center gap-2 text-lg">
                  Learn about Deliverability <ArrowRight size={20} />
                </Link>
              </div>
              <div className="flex-1 w-full relative">
                <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative z-10 text-white">
                  <h4 className="font-bold text-lg mb-6">Domain Health</h4>
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-40 h-40 rounded-full border-8 border-slate-800 flex items-center justify-center">
                      {/* Fake circular progress */}
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="72" fill="none" stroke="#8b5cf6" strokeWidth="8" strokeDasharray="452" strokeDashoffset="45"></circle>
                      </svg>
                      <div className="text-center">
                        <span className="text-4xl font-black text-white">98%</span>
                        <span className="block text-xs text-slate-400 mt-1">Excellent</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-slate-800 rounded-xl p-3">
                      <span className="block text-2xl font-black text-emerald-400">100%</span>
                      <span className="text-xs text-slate-400">Inbox Rate</span>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-3">
                      <span className="block text-2xl font-black text-purple-400">0%</span>
                      <span className="text-xs text-slate-400">Spam Rate</span>
                    </div>
                  </div>
                </div>
                {/* Decorative blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-200/40 blur-3xl rounded-full -z-10" />
              </div>
            </div>
          </div>
        </section>

        {/* Global CTA */}
        <section className="py-24 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 blur-[100px] rounded-full mix-blend-screen" />
          <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
            <h2 className="text-5xl font-black text-white tracking-tight mb-8">Ready to multiply your revenue?</h2>
            <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">Join the high-performing teams using AuraSend to find leads, verify contacts, and automate outreach at unparalleled scale.</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/login" className="h-16 px-10 bg-white hover:bg-indigo-50 text-indigo-600 rounded-full font-bold text-lg transition-all shadow-xl shadow-indigo-900/50 flex items-center gap-2 transform hover:-translate-y-1">
                Sign up for free <ArrowRight size={20} />
              </Link>
            </div>
            <p className="text-sm text-indigo-300 mt-6 mt-6 flex justify-center gap-6">
              <span>✓ Fully unlimited inboxes</span>
              <span>✓ Free 7-day trial</span>
              <span>✓ Cancel anytime</span>
            </p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

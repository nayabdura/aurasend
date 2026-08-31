import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { FileText, CheckCircle2, AlertTriangle, ShieldCheck, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service — AuraSend',
  description: 'AuraSend Terms of Service outline acceptable use, subscription policies, and platform terms.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-200">
      <MarketingNav />

      <main className="pt-28 pb-20 max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
              <p className="text-sm text-slate-500 font-medium">Last updated: August 31, 2026</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-700 font-normal leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Agreement to Terms</h2>
              <p>
                By creating an account or accessing AuraSend ("Service"), operated at <Link href="/" className="text-indigo-600 font-semibold underline">aurasend.vercel.app</Link>, you agree to be bound by these Terms of Service ("Terms") and our <Link href="/privacy" className="text-indigo-600 font-semibold underline">Privacy Policy</Link>. If you do not agree, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. Description of Service</h2>
              <p>
                AuraSend provides email verification, inbox warmup automation, drip campaign management, and analytics tools for legitimate business outreach.
              </p>
            </section>

            <section className="bg-amber-50/60 p-6 rounded-2xl border border-amber-200/80">
              <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="text-amber-600" size={20} />
                3. Acceptable Use Policy & Email Compliance
              </h2>
              <p className="mb-3 text-slate-700 font-medium">
                You agree to use AuraSend exclusively for legal B2B communications and strictly adhere to CAN-SPAM, GDPR, CASL, and Google API policy requirements.
              </p>
              <ul className="space-y-2 text-sm font-medium text-slate-800">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <strong>No Illegal Spamming:</strong> You may not send unsolicited bulk marketing emails to purchased or scraped consumers without valid opt-out mechanisms.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <strong>Unsubscribe Requirement:</strong> All outreach emails must contain clear unsubscribe options and valid physical sender addresses.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <strong>Account Termination:</strong> We reserve the right to suspend or terminate any user account exhibiting excessive hard bounce rates (&gt; 10%), high spam complaint ratios, or severe policy violations.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Accounts & Security</h2>
              <p>
                You are responsible for safeguarding your account login credentials and connected OAuth access tokens. You must notify us immediately of any unauthorized access or breach of security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Subscriptions & Billing</h2>
              <p>
                Certain features of AuraSend are available on a paid subscription basis. Subscriptions are billed in advance on a recurring monthly or annual cycle via Stripe. You may cancel your subscription at any time prior to the renewal date through your Billing Settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable law, AuraSend and its suppliers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, or data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Contact Information</h2>
              <p className="flex items-center gap-2 text-slate-600">
                <Mail size={18} className="text-indigo-600" />
                For questions concerning these Terms, contact us at: <a href="mailto:support@aurasend.com" className="text-indigo-600 font-semibold underline">support@aurasend.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

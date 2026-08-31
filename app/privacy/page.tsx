import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { Shield, Lock, FileText, CheckCircle2, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — AuraSend',
  description: 'AuraSend Privacy Policy details how we handle user data, Google OAuth authentication, Gmail API data, and data security.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-200">
      <MarketingNav />

      <main className="pt-28 pb-20 max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
              <p className="text-sm text-slate-500 font-medium">Last updated: August 31, 2026</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-700 font-normal leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Introduction</h2>
              <p>
                AuraSend ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at <Link href="/" className="text-indigo-600 font-semibold underline">aurasend.vercel.app</Link> or use our email outreach platform.
              </p>
            </section>

            <section className="bg-indigo-50/60 p-6 rounded-2xl border border-indigo-100">
              <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Lock className="text-indigo-600" size={20} />
                2. Google User Data & Gmail API Limited Use Disclosure
              </h2>
              <p className="mb-4">
                AuraSend connects with Google OAuth and the Gmail API to allow users to send automated outreach emails, track replies, and monitor sending health.
              </p>
              <ul className="space-y-2 text-sm font-medium text-slate-800">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <strong>Usage Scopes:</strong> We request only the minimum necessary Google OAuth scopes (`openid`, `email`, `profile`, `gmail.send`, `gmail.readonly`, `gmail.modify`) to authenticate users and enable email operations authorized by the user.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <strong>No Data Selling or Advertising:</strong> AuraSend does NOT sell, rent, or trade Google user data to any third party. Google user data is NEVER used for serving advertisements or training AI models without explicit opt-in.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <strong>Limited Use Requirement:</strong> AuraSend's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Information We Collect</h2>
              <p className="mb-3">We collect information that you voluntarily provide when registering an account, integrating email inboxes, or communicating with us:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600">
                <li><strong>Account Information:</strong> Name, email address, password hash, role, and billing details.</li>
                <li><strong>Connected Inbox Credentials:</strong> OAuth refresh tokens, access tokens, and optional SMTP settings (all stored encrypted with AES-256).</li>
                <li><strong>Lead & Campaign Data:</strong> Lead emails, custom template content, sending logs, and reply status.</li>
                <li><strong>Technical & Log Data:</strong> IP address, browser type, device information, and interaction logs.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. How We Use Your Information</h2>
              <p className="mb-3">We use the collected information for the following legitimate business purposes:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600">
                <li>To provide, maintain, and operate the AuraSend platform services.</li>
                <li>To authenticate user sign-in and maintain secure user sessions.</li>
                <li>To execute email drip sequences and warmup schedules requested by the user.</li>
                <li>To calculate analytics, bounce rates, and inbox health statistics.</li>
                <li>To prevent fraud, abuse, and violations of our Terms of Service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Storage & Security</h2>
              <p>
                We implement industry-standard administrative, technical, and physical security controls to safeguard your personal data. All OAuth tokens and sensitive keys are encrypted at rest using AES-256-GCM. Connections are secured using SSL/TLS 1.3 encryption.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Data Retention & Deletion</h2>
              <p>
                You may disconnect your Google account or delete your AuraSend profile at any time through your Account Settings. Upon account deletion, all associated access tokens, lead records, and campaign logs are permanently purged from our primary production databases within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Contact Us</h2>
              <p className="flex items-center gap-2 text-slate-600">
                <Mail size={18} className="text-indigo-600" />
                If you have any questions or privacy inquiries, contact us at: <a href="mailto:support@aurasend.com" className="text-indigo-600 font-semibold underline">support@aurasend.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

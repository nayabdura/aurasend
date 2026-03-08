'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function GmailPageClient() {
    const searchParams = useSearchParams();
    const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (success === 'connected' || success === 'true') {
            setBanner({ type: 'success', text: '✅ Gmail account connected successfully via OAuth!' });
        } else if (error) {
            const errorMessages: Record<string, string> = {
                'access_denied': 'OAuth access was denied. Please try again and allow the requested permissions.',
                'missing_code_or_state': 'OAuth handshake failed — missing code or state. Please try reconnecting.',
                'account_not_found_or_access_denied': 'Account not found or you do not have permission to access it.',
                'oauth_session_expired': 'Your session expired during OAuth. Please log in again.',
                'missing_oauth_credentials': 'No OAuth credentials found for this account. Please re-enter your Client ID and Secret.',
            };
            setBanner({
                type: 'error',
                text: '❌ ' + (errorMessages[error] || decodeURIComponent(error))
            });
        }

        // Clean URL params without page reload
        if (success || error) {
            const url = new URL(window.location.href);
            url.searchParams.delete('success');
            url.searchParams.delete('error');
            window.history.replaceState({}, '', url.pathname);
        }
    }, [searchParams]);

    if (!banner) return null;

    return (
        <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium ${banner.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            {banner.type === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            <span className="flex-1">{banner.text}</span>
            <button onClick={() => setBanner(null)} className="text-gray-400 hover:text-gray-600 ml-2">
                <X size={16} />
            </button>
        </div>
    );
}

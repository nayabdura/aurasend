import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/context/ToastContext';
import { AppProvider } from '@/context/AppContext';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'AuraSend — Cold Email & Outreach Automation',
    template: '%s | AuraSend',
  },
  description:
    'AuraSend: Professional cold email platform with email warmup, campaign management, deliverability tools, and inbox tracking.',
  keywords: ['cold email', 'email outreach', 'email warmup', 'campaign automation', 'SMTP'],
  authors: [{ name: 'AuraSend' }],
  metadataBase: new URL('https://aurasend.com'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'AuraSend',
    title: 'AuraSend — Cold Email & Outreach Automation',
    description: 'Professional cold email platform with email warmup, intelligent campaigns, and deliverability tools.',
    url: 'https://aurasend.com',
    images: [{ url: '/og-image.jpeg', width: 1200, height: 630, alt: 'AuraSend Dashboard Preview' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AuraSend — Professional Cold Email Automation',
    description: 'Connect unlimited inboxes, warm them up automatically, and run intelligent campaigns.',
    creator: '@aurasend',
    images: ['/twitter-image.jpeg']
  },
  verification: {
    google: 'google185bf4e765e4af7a',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} font-sans`}>
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-zinc-900/50 dark:bg-zinc-900/30 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 dark:text-zinc-50 selection:bg-blue-500/30">
        {/* AppProvider: SWR-backed global auth state — deduped across all components */}
        <AppProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}

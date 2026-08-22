import Link from 'next/link';
import db from '@/lib/db';
import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';
import { ArrowRight, BookOpen, Bookmark, Clock, UserCircle2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Blog — AuraSend',
    description: 'Cold email tips, deliverability guides, outreach strategies, and platform updates from the AuraSend team.',
    keywords: 'cold email blog, outreach tips, deliverability guide, B2B sales blog, email marketing',
    openGraph: {
        title: 'Blog — AuraSend',
        description: 'Cold email tips, deliverability guides, and B2B outreach strategies.',
        type: 'website',
    },
};

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
    let posts: any[] = [];
    try {
        const result = await db.prepare('SELECT id, title, slug, excerpt, author, created_at FROM blog_posts WHERE is_published = 1 ORDER BY created_at DESC').all();
        posts = Array.isArray(result) ? result : [];
    } catch (e) {
        posts = [];
    }

    const featured = posts[0] || null;
    const rest = posts.slice(1);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-900/50 font-sans">
            <MarketingNav active="/blog" />

            <main className="pt-32 pb-24 relative overflow-hidden">
                <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-[30%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    {/* Header */}
                    <div className="text-center max-w-4xl mx-auto mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold tracking-wide shadow-sm mb-6">
                            <BookOpen size={16} /> AuraSend Journal
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-zinc-50 tracking-tight mb-6">
                            Growth insights & <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">outreach guides.</span>
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">Strategic resources, sequence teardowns, deliverability frameworks, and platform updates to help you close more deals.</p>
                    </div>

                    {posts.length === 0 ? (
                        <div className="text-center py-32 border border-dashed border-slate-300 rounded-[3rem] bg-white dark:bg-zinc-900/60 shadow-sm">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Bookmark size={32} className="text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-50 mb-3 tracking-tight">We're writing our first article</h3>
                            <p className="text-lg text-slate-500 dark:text-zinc-400 font-medium">Our growth team is working on high-quality guides for you. Check back soon.</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* Featured Post */}
                            {featured && (
                                <Link href={`/blog/${featured.slug}`} className="group block">
                                    <article className="bg-slate-950 rounded-[3rem] p-10 md:p-16 overflow-hidden relative shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-2 transition-all duration-300">
                                        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-slate-950 to-slate-950"></div>
                                        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                                            <div>
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-widest rounded-full mb-8">
                                                    ✨ Featured Article
                                                </div>
                                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6 leading-tight group-hover:text-indigo-200 transition-colors">
                                                    {featured.title}
                                                </h2>
                                                {featured.excerpt && (
                                                    <p className="text-lg text-slate-400 leading-relaxed font-medium mb-10">{featured.excerpt}</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-300">
                                                    <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50">
                                                        <Clock size={16} className="text-indigo-400" />
                                                        {featured.created_at ? new Date(featured.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                                    </div>
                                                    {featured.author && (
                                                        <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50">
                                                            <UserCircle2 size={16} className="text-emerald-400" />
                                                            {featured.author}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="hidden md:flex justify-end">
                                                <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-900/60 text-slate-900 dark:text-zinc-50 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-xl">
                                                    <ArrowRight size={24} />
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            )}

                            {/* Rest of Posts */}
                            {rest.length > 0 && (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {rest.map((post: any) => (
                                        <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                                            <article className="bg-white dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 rounded-[2rem] p-8 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 h-full flex flex-col relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 hover:-translate-y-2">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full group-hover:bg-indigo-500/10 transition-colors duration-500" />

                                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 relative z-10">
                                                    <Clock size={14} className="text-indigo-500" />
                                                    <time>
                                                        {post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                                    </time>
                                                </div>

                                                <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-50 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-blue-500 transition-all mb-4 leading-tight flex-1 relative z-10">
                                                    {post.title}
                                                </h2>

                                                {post.excerpt && (
                                                    <p className="text-slate-500 dark:text-zinc-400 text-base leading-relaxed font-medium mb-8 line-clamp-3 relative z-10">{post.excerpt}</p>
                                                )}

                                                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100 dark:border-zinc-800/80 relative z-10">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-zinc-300">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800/50 flex items-center justify-center text-slate-400">
                                                            <UserCircle2 size={14} />
                                                        </div>
                                                        {post.author || 'AuraSend'}
                                                    </div>
                                                    <span className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                        <ArrowRight size={18} />
                                                    </span>
                                                </div>
                                            </article>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}

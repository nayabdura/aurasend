import Link from 'next/link';
import { notFound } from 'next/navigation';
import db from '@/lib/db';
import type { Metadata } from 'next';
import { MarketingNav, MarketingFooter } from '@/components/MarketingLayout';

export const revalidate = 60;

interface Props {
    params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    let post: any = null;
    try {
        post = db.prepare('SELECT title, excerpt FROM blog_posts WHERE slug = ? AND is_published = 1').get(params.slug);
    } catch (e) { }

    if (!post) return { title: 'Post Not Found — MailPilot' };

    return {
        title: `${post.title} — MailPilot Blog`,
        description: post.excerpt || `Read ${post.title} on the MailPilot Blog.`,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: 'article',
        },
    };
}

export default function BlogPostPage({ params }: Props) {
    let post: any = null;
    try {
        post = db.prepare('SELECT * FROM blog_posts WHERE slug = ? AND is_published = 1').get(params.slug);
    } catch (e) { }

    if (!post) notFound();

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-900/60 font-sans">
            <MarketingNav active="/blog" />

            <main className="pt-32 pb-24">
                <article className="max-w-3xl mx-auto px-6">
                    {/* Schema JSON-LD for SEO */}
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify({
                                '@context': 'https://schema.org',
                                '@type': 'Article',
                                headline: post.title,
                                description: post.excerpt,
                                author: { '@type': 'Person', name: post.author || 'MailPilot Team' },
                                datePublished: post.created_at,
                                dateModified: post.updated_at || post.created_at,
                                publisher: {
                                    '@type': 'Organization',
                                    name: 'MailPilot',
                                    logo: {
                                        '@type': 'ImageObject',
                                        url: 'https://mailpilot.com/logo.png' // Adjust domain when deploying
                                    }
                                },
                            }),
                        }}
                    />

                    <div className="mb-10 text-center">
                        <time className="text-indigo-600 font-bold text-sm uppercase tracking-widest block mb-4">
                            {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </time>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-zinc-50 tracking-tight leading-tight mb-6">{post.title}</h1>
                        {post.excerpt && (
                            <p className="text-xl text-slate-500 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">{post.excerpt}</p>
                        )}
                        <div className="flex items-center justify-center gap-3 mt-8">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                {(post.author || 'M')[0].toUpperCase()}
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-slate-900 dark:text-zinc-50 text-sm">{post.author || 'MailPilot Team'}</p>
                                <p className="text-slate-400 text-xs">MailPilot</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-600 hover:prose-a:underline prose-img:rounded-2xl prose-img:border prose-img:border-slate-200 dark:border-zinc-800 prose-img:shadow-sm"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </article>

                <div className="max-w-3xl mx-auto px-6 mt-16 pt-12 border-t border-slate-100 dark:border-zinc-800/80 flex justify-center">
                    <Link href="/blog" className="inline-flex items-center gap-2 h-12 px-6 bg-slate-100 dark:bg-zinc-800/50 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 rounded-xl font-bold transition-all text-sm">
                        ← Back to Blog
                    </Link>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}

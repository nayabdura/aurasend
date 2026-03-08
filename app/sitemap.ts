import { MetadataRoute } from 'next';
import db from '@/lib/db';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aurasend.co';

    const staticPages = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1 },
        { url: `${baseUrl}/features`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
        { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
        { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
        { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.5 },
        { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    ];

    let blogPages: MetadataRoute.Sitemap = [];
    try {
        const posts = db.prepare("SELECT slug, updated_at, created_at FROM blog_posts WHERE is_published = 1").all() as any[];
        blogPages = posts.map(post => ({
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: new Date(post.updated_at || post.created_at),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        }));
    } catch (e) {
        // DB not initialized yet
    }

    return [...staticPages, ...blogPages];
}

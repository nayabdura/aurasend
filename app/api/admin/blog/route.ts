import { NextResponse } from 'next/server';
import { requireMaster } from '@/lib/auth';
import db from '@/lib/db';

// POST — Create new blog post
export async function POST(request: Request) {
    try {
        await requireMaster();
        const data = await request.json();

        if (!data.title || !data.slug || !data.content) {
            return NextResponse.json({ error: 'Title, slug, and content are required' }, { status: 400 });
        }

        db.prepare(`
            INSERT INTO blog_posts (title, slug, excerpt, content, is_published) 
            VALUES (?, ?, ?, ?, 1)
        `).run(data.title, data.slug, data.excerpt || '', data.content);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message?.includes('UNIQUE')) {
            return NextResponse.json({ error: 'A post with this slug already exists. Use a different URL slug.' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Update existing blog post
export async function PUT(request: Request) {
    try {
        await requireMaster();
        const data = await request.json();

        if (!data.id && !data.slug) {
            return NextResponse.json({ error: 'Post ID or slug required' }, { status: 400 });
        }

        db.prepare(`
            UPDATE blog_posts 
            SET title = ?, excerpt = ?, content = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(data.title, data.excerpt, data.content, data.is_published ?? 1, data.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Remove a blog post
export async function DELETE(request: Request) {
    try {
        await requireMaster();
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

        db.prepare('DELETE FROM blog_posts WHERE id = ?').run(parseInt(id));
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET — List all blog posts (admin view, includes drafts)
export async function GET(request: Request) {
    try {
        await requireMaster();
        const posts = db.prepare('SELECT * FROM blog_posts ORDER BY created_at DESC').all();
        return NextResponse.json({ posts });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

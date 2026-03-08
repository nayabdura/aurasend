import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
    try {
        const user = await requireAuth();
        if (user.role !== 'master') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const formData = await req.formData();
        const file = formData.get('image') as File | null;
        if (!file) {
            return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save to public/uploads
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = file.name.split('.').pop();
        const filename = `${uniqueSuffix}.${ext}`;
        const filepath = join(uploadsDir, filename);

        await writeFile(filepath, buffer);

        // Return URL
        return NextResponse.json({ url: `/uploads/${filename}` });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

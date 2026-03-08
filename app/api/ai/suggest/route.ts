import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { suggestTemplateContent } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        await requireAuth();
        const { type, company } = await req.json();

        const suggestion = suggestTemplateContent(type, company);

        return NextResponse.json(suggestion);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = cookies();
        cookieStore.delete('auth_token');

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json(
            { error: 'Logout failed' },
            { status: 500 }
        );
    }
}

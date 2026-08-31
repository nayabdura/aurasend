import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('google-site-verification: google185bf4e765e4af7a.html\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

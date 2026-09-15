import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function PUT(req: Request) {
    try {
        const user = await requireAuth();
        const { currentPassword, newPassword } = await req.json();

        if (currentPassword && newPassword) {
            const userRec = await prisma.user.findUnique({
                where: { id: user.id },
                select: { passwordHash: true }
            });
            if (!userRec || !(await bcrypt.compare(currentPassword, userRec.passwordHash))) {
                return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
            }

            const hashed = await bcrypt.hash(newPassword, 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: hashed }
            });
            return NextResponse.json({ success: true, message: 'Password updated successfully' });
        }

        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const user = await requireAuth();
        const { currentPassword } = await req.json();

        const userRec = await prisma.user.findUnique({
            where: { id: user.id },
            select: { passwordHash: true, role: true }
        });
        if (!userRec || !(await bcrypt.compare(currentPassword, userRec.passwordHash))) {
            return NextResponse.json({ error: 'Incorrect password' }, { status: 400 });
        }

        const roleStr = String(userRec.role).toUpperCase();
        if (roleStr === 'MASTER') {
            return NextResponse.json({ error: 'Master account cannot be deleted' }, { status: 403 });
        }

        await prisma.user.delete({ where: { id: user.id } });

        const response = NextResponse.json({ success: true, message: 'Account deleted' });
        response.cookies.delete('auth_token');
        return response;
    } catch (e: any) {
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

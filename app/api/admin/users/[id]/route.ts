import { NextResponse } from 'next/server';
import { requireMaster } from '@/lib/auth';
import db from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const master = await requireMaster();
        const userId = parseInt(params.id);

        if (isNaN(userId)) {
            return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
        }

        // Prevent self-deletion
        if (userId === master.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        // Make sure target user is not also a master
        const target = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
        if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        if (target.role === 'master') {
            return NextResponse.json({ error: 'Cannot delete a master admin account' }, { status: 403 });
        }

        db.prepare('DELETE FROM users WHERE id = ?').run(userId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        await requireMaster();
        const userId = parseInt(params.id);
        if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const data = await request.json();
        const { plan, plan_status, role } = data;

        if (plan) db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, userId);
        if (plan_status) db.prepare('UPDATE users SET plan_status = ? WHERE id = ?').run(plan_status, userId);
        if (role && role !== 'master') db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

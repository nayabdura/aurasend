'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function disconnectAccount(id: number) {
    db.prepare("UPDATE gmail_accounts SET is_connected = 0, status = 'disconnected' WHERE id = ?").run(id);
    revalidatePath('/gmail');
}

export async function activateAccount(id: number) {
    db.prepare("UPDATE gmail_accounts SET status = 'active' WHERE id = ?").run(id);
    revalidatePath('/gmail');
}

export async function pauseAccount(id: number) {
    db.prepare("UPDATE gmail_accounts SET status = 'paused' WHERE id = ?").run(id);
    revalidatePath('/gmail');
}

export async function updateSignature(id: number, signature: string) {
    db.prepare("UPDATE gmail_accounts SET signature = ? WHERE id = ?").run(signature, id);
    revalidatePath('/gmail');
}

export async function updateAccountName(id: number, name: string) {
    db.prepare("UPDATE gmail_accounts SET name = ? WHERE id = ?").run(name.trim(), id);
    revalidatePath('/gmail');
}

export async function updateDailyLimit(id: number, limit: number) {
    db.prepare("UPDATE gmail_accounts SET daily_limit = ? WHERE id = ?").run(limit, id);
    revalidatePath('/gmail');
}


'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function disconnectAccount(id: number) {
    await prisma.gmailAccount.update({
        where: { id },
        data: { isConnected: false, status: 'disconnected' },
    });
    revalidatePath('/gmail');
}

export async function activateAccount(id: number) {
    await prisma.gmailAccount.update({
        where: { id },
        data: { status: 'active' },
    });
    revalidatePath('/gmail');
}

export async function pauseAccount(id: number) {
    await prisma.gmailAccount.update({
        where: { id },
        data: { status: 'paused' },
    });
    revalidatePath('/gmail');
}

export async function updateSignature(id: number, signature: string) {
    await prisma.gmailAccount.update({
        where: { id },
        data: { signature },
    });
    revalidatePath('/gmail');
}

export async function updateAccountName(id: number, name: string) {
    await prisma.gmailAccount.update({
        where: { id },
        data: { name: name.trim() },
    });
    revalidatePath('/gmail');
}

export async function updateDailyLimit(id: number, limit: number) {
    await prisma.gmailAccount.update({
        where: { id },
        data: { dailyLimit: limit },
    });
    revalidatePath('/gmail');
}

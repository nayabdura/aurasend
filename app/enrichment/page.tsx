import DashboardLayout from '@/components/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import EnrichmentClient from '@/app/enrichment/EnrichmentClient';

export const dynamic = 'force-dynamic';

export default async function EnrichmentPage() {
    const user = await requireAuth();

    let contacts: any[] = [];
    try {
        const isMaster = ['MASTER', 'ADMIN'].includes(String(user.role || '').toUpperCase());
        const list = await prisma.contact.findMany({
            where: isMaster ? {} : { userId: user.id },
            orderBy: { id: 'desc' },
            take: 500,
        });

        contacts = list.map((c) => ({
            id: c.id,
            user_id: c.userId,
            full_name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email.split('@')[0],
            first_name: c.firstName,
            last_name: c.lastName,
            email: c.email,
            company_name: c.company,
            company_domain: c.email.split('@')[1] || null,
            title: c.currentRole,
            linkedin_url: null,
            location: null,
            source: 'Scraped',
            status: c.replyStatus || 'active',
            created_at: c.createdAt,
        }));
    } catch (e) {
        console.error('[EnrichmentPage] Error fetching contacts:', e);
        contacts = [];
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-50">Contact Enrichment</h1>
                    <p className="text-slate-600 dark:text-zinc-50 mt-1">
                        Scrape LinkedIn profiles or company domains to extract contacts completely free.
                    </p>
                </div>

                <EnrichmentClient initialContacts={contacts} />
            </div>
        </DashboardLayout>
    );
}

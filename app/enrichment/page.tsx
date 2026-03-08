import DashboardLayout from '@/components/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';
import EnrichmentClient from '@/app/enrichment/EnrichmentClient';

export const dynamic = 'force-dynamic';

export default async function EnrichmentPage() {
    const user = await requireAuth();

    let contacts: any[] = [];
    if (user.role === 'master') {
        contacts = db.prepare('SELECT * FROM enriched_contacts ORDER BY id DESC LIMIT 500').all();
    } else {
        contacts = db.prepare('SELECT * FROM enriched_contacts WHERE user_id = ? ORDER BY id DESC LIMIT 500').all(user.id);
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Contact Enrichment</h1>
                    <p className="text-gray-600 mt-1">
                        Scrape LinkedIn profiles or company domains to extract contacts completely free.
                    </p>
                </div>

                <EnrichmentClient initialContacts={contacts} />
            </div>
        </DashboardLayout>
    );
}

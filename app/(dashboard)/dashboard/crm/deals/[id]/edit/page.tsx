import { requirePermissionPage } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DealForm } from '@/components/crm/deal-form';

async function getDealAndFormData(dealId: string) {
  const [dealResult, contactsResult, companiesResult] = await Promise.all([
    supabaseAdmin.from('deals').select('*').eq('id', dealId).single(),
    supabaseAdmin.from('contacts').select('id, first_name, last_name, email').order('first_name'),
    supabaseAdmin.from('companies').select('id, name').order('name'),
  ]);

  return {
    deal: dealResult.data,
    contacts: contactsResult.data || [],
    companies: companiesResult.data || [],
  };
}

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage('deals.update');

  const { id } = await params;
  const { deal, contacts, companies } = await getDealAndFormData(id);

  if (!deal) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/crm/deals">
            <Button variant="outline">← Back to Deals</Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Deal Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested deal could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/crm/deals/${deal.id}`}>
          <Button variant="outline">← Back to Deal</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Deal</h1>
          <p className="text-gray-600 mt-1">{deal.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deal Information</CardTitle>
          <CardDescription>
            Update the deal details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DealForm
            contacts={contacts}
            companies={companies}
            initialData={{
              id: deal.id,
              name: deal.name,
              description: deal.description || '',
              amount: deal.amount,
              stage: deal.stage,
              probability: deal.probability,
              contactId: deal.contact_id || '',
              companyId: deal.company_id || '',
              expectedCloseDate: deal.expected_close_date || '',
              tags: deal.tags || [],
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
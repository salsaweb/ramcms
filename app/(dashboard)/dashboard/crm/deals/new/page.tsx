import { requirePermissionPage } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DealForm } from '@/components/crm/deal-form';

async function getFormData() {
  const [contacts, companies] = await Promise.all([
    supabaseAdmin.from('contacts').select('id, first_name, last_name, email').order('first_name'),
    supabaseAdmin.from('companies').select('id, name').order('name'),
  ]);

  return {
    contacts: contacts.data || [],
    companies: companies.data || [],
  };
}

export default async function NewDealPage() {
  await requirePermissionPage('deals.create');
  const { contacts, companies } = await getFormData();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm/deals">
          <Button variant="outline">← Back to Deals</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Deal</h1>
          <p className="text-gray-600 mt-1">Add a new sales opportunity</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deal Information</CardTitle>
          <CardDescription>
            Fill in the details for the new opportunity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DealForm contacts={contacts} companies={companies} />
        </CardContent>
      </Card>
    </div>
  );
}
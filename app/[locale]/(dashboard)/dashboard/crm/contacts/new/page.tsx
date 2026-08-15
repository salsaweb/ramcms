import { requirePermissionPage } from '@/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ContactForm } from '@/components/crm/contact-form';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function getCompanies() {
  const { data } = await supabaseAdmin
    .from('companies')
    .select('id, name')
    .order('name', { ascending: true });
  
  return data || [];
}

async function getCustomFields() {
  const { data } = await supabaseAdmin
    .from('contact_custom_fields')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  return data || [];
}

export default async function NewContactPage() {
  await requirePermissionPage('contacts.create');
  const [companies, customFields] = await Promise.all([
    getCompanies(),
    getCustomFields(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm/contacts">
          <Button variant="outline">← Back to Contacts</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Contact</h1>
          <p className="text-gray-600 mt-1">Create a new contact record</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Fill in the details for the new contact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm companies={companies} customFields={customFields} />
        </CardContent>
      </Card>
    </div>
  );
}
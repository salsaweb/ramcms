import { requirePermissionPage } from '@/lib/auth/session';
import { getContact } from '@/app/actions/crm/contacts';
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

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage('contacts.update');

  const { id } = await params;
  const [result, companies, customFields] = await Promise.all([
    getContact(id),
    getCompanies(),
    getCustomFields(),
  ]);

  if (!result.success || !result.contact) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/crm/contacts">
            <Button variant="outline">← Back to Contacts</Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Contact Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested contact could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contact = result.contact;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/crm/contacts/${contact.id}`}>
          <Button variant="outline">← Back to Contact</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Contact</h1>
          <p className="text-gray-600 mt-1">
            {contact.first_name} {contact.last_name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Update the contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm 
            companies={companies}
            customFields={customFields}
            initialData={{
              id: contact.id,
              firstName: contact.first_name,
              lastName: contact.last_name,
              email: contact.email || '',
              phone: contact.phone || '',
              mobile: contact.mobile || '',
              jobTitle: contact.job_title || '',
              companyId: contact.company_id || '',
              contactType: contact.contact_type,
              leadStatus: contact.lead_status,
              city: contact.city || '',
              state: contact.state || '',
              country: contact.country || '',
              tags: contact.tags || [],
              customFields: contact.custom_fields || {},
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
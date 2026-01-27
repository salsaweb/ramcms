import { requirePermissionPage } from '@/lib/auth/session';
import { getContacts } from '@/app/actions/crm/contacts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function ContactsPage() {
  await requirePermissionPage('contacts.read');
  const result = await getContacts({ limit: 50 });
  const contacts = result.success && result.contacts ? result.contacts : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-2 text-gray-600">
            Manage your contacts and leads
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/crm/contacts/new">Add Contact</Link>
        </Button>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No contacts yet</CardTitle>
            <CardDescription>
              Get started by adding your first contact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/crm/contacts/new">Add Your First Contact</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Contacts ({contacts.length})</CardTitle>
            <CardDescription>View and manage your contact database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact: any) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/crm/contacts/${contact.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {contact.first_name} {contact.last_name}
                        </Link>
                        {contact.job_title && (
                          <div className="text-xs text-gray-500">{contact.job_title}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contact.email || '-'}</div>
                        <div className="text-xs text-gray-500">{contact.phone || contact.mobile || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contact.companies?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          contact.contact_type === 'customer'
                            ? 'bg-green-100 text-green-800'
                            : contact.contact_type === 'lead'
                            ? 'bg-blue-100 text-blue-800'
                            : contact.contact_type === 'partner'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {contact.contact_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          contact.lead_status === 'qualified'
                            ? 'bg-green-100 text-green-800'
                            : contact.lead_status === 'contacted'
                            ? 'bg-yellow-100 text-yellow-800'
                            : contact.lead_status === 'new'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {contact.lead_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{contact.lead_score}</div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                contact.lead_score >= 70
                                  ? 'bg-green-500'
                                  : contact.lead_score >= 40
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${contact.lead_score}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
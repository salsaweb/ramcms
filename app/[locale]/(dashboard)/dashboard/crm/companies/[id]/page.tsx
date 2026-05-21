import { requirePermissionPage } from '@/lib/auth/session';
import { getCompany } from '@/app/actions/crm/companies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DeleteCompanyButton } from '@/components/crm/delete-company-button';

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage('companies.read');

  const { id } = await params;
  const result = await getCompany(id);

  if (!result.success || !result.company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/crm/companies">
            <Button variant="outline">← Back to Companies</Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Company Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested company could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const company = result.company;
  const contacts = result.contacts || [];
  const deals = result.deals || [];
  const activities = result.activities || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/crm/companies">
            <Button variant="outline">← Back</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            {company.industry && (
              <p className="text-gray-600">{company.industry}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/crm/companies/${company.id}/edit`}>
            <Button>Edit Company</Button>
          </Link>
          <DeleteCompanyButton companyId={company.id} companyName={company.name} />
        </div>
      </div>

      {/* Company Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Website</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {company.website ? (
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {company.website}
                  </a>
                ) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{company.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{company.phone || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  company.company_type === 'customer'
                    ? 'bg-green-100 text-green-800'
                    : company.company_type === 'prospect'
                    ? 'bg-blue-100 text-blue-800'
                    : company.company_type === 'partner'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {company.company_type}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Industry</dt>
              <dd className="mt-1 text-sm text-gray-900">{company.industry || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Employees</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {company.employee_count ? company.employee_count.toLocaleString() : '-'}
              </dd>
            </div>
            {company.annual_revenue && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Annual Revenue</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  ${company.annual_revenue.toLocaleString()}
                </dd>
              </div>
            )}
            {(company.city || company.state || company.country) && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {company.address_line1 && <div>{company.address_line1}</div>}
                  {company.city && company.country && (
                    <div>
                      {company.city}
                      {company.state && `, ${company.state}`}
                      {`, ${company.country}`}
                    </div>
                  )}
                </dd>
              </div>
            )}
            {company.tags && company.tags.length > 0 && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {company.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contacts ({contacts.length})</CardTitle>
              <CardDescription>People at this company</CardDescription>
            </div>
            <Link href={`/dashboard/crm/contacts/new?company=${company.id}`}>
              <Button size="sm">+ Add Contact</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-sm text-gray-500">No contacts at this company yet</p>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact: any) => (
                <Link
                  key={contact.id}
                  href={`/dashboard/crm/contacts/${contact.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {contact.first_name} {contact.last_name}
                      </h3>
                      {contact.job_title && (
                        <p className="text-sm text-gray-600 mt-1">{contact.job_title}</p>
                      )}
                      {contact.email && (
                        <p className="text-sm text-gray-500 mt-1">{contact.email}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        contact.contact_type === 'customer'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {contact.contact_type}
                      </span>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        contact.lead_status === 'qualified'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {contact.lead_status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deals */}
      {deals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deals ({deals.length})</CardTitle>
            <CardDescription>Opportunities with this company</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deals.map((deal: any) => (
                <div key={deal.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{deal.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{deal.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        ${deal.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">{deal.probability}%</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      deal.stage === 'closed_won'
                        ? 'bg-green-100 text-green-800'
                        : deal.stage === 'closed_lost'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {deal.stage.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities */}
      {activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest interactions with this company</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.slice(0, 10).map((activity: any) => (
                <div key={activity.id} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          activity.activity_type === 'call'
                            ? 'bg-blue-100 text-blue-800'
                            : activity.activity_type === 'email'
                            ? 'bg-purple-100 text-purple-800'
                            : activity.activity_type === 'meeting'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.activity_type}
                        </span>
                        <span className="font-medium text-sm">{activity.subject}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        by {activity.creator?.name || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { requirePermissionPage } from '@/lib/auth/session';
import { getCompanies } from '@/app/actions/crm/companies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function CompaniesPage() {
  await requirePermissionPage('companies.read');
  const result = await getCompanies({ limit: 50 });
  const companies = result.success && result.companies ? result.companies : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="mt-2 text-gray-600">
            Manage your company and account records
          </p>
        </div>
        <Button>
          <Link href="/dashboard/crm/companies/new">Add Company</Link>
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No companies yet</CardTitle>
            <CardDescription>
              Get started by adding your first company
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>
              <Link href="/dashboard/crm/companies/new">Add Your First Company</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Companies ({companies.length})</CardTitle>
            <CardDescription>View and manage your company database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companies.map((company: any) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/crm/companies/${company.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {company.name}
                        </Link>
                        {company.website && (
                          <div className="text-xs text-gray-500">
                            <a 
                              href={company.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {company.website}
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{company.industry || '-'}</div>
                        {company.employee_count && (
                          <div className="text-xs text-gray-500">
                            {company.employee_count.toLocaleString()} employees
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          company.company_type === 'customer'
                            ? 'bg-green-100 text-green-800'
                            : company.company_type === 'prospect'
                            ? 'bg-blue-100 text-blue-800'
                            : company.company_type === 'partner'
                            ? 'bg-purple-100 text-purple-800'
                            : company.company_type === 'vendor'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {company.company_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{company.email || '-'}</div>
                        <div className="text-xs text-gray-500">{company.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.city && company.country
                          ? `${company.city}, ${company.country}`
                          : company.city || company.country || '-'}
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
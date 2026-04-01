import { requirePermissionPage } from '@/lib/auth/session';
import { getCompany } from '@/app/actions/crm/companies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CompanyForm } from '@/components/crm/company-form';

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage('companies.update');

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/crm/companies/${company.id}`}>
          <Button variant="outline">← Back to Company</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Company</h1>
          <p className="text-gray-600 mt-1">{company.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Update the company details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyForm 
            initialData={{
              id: company.id,
              name: company.name,
              website: company.website || '',
              email: company.email || '',
              phone: company.phone || '',
              companyType: company.company_type,
              industry: company.industry || '',
              employeeCount: company.employee_count || '',
              annualRevenue: company.annual_revenue || '',
              addressLine1: company.address_line1 || '',
              city: company.city || '',
              state: company.state || '',
              country: company.country || '',
              tags: company.tags || [],
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
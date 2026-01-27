import { requirePermissionPage } from '@/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';

async function getCRMStats() {
  const [contacts, companies, deals, tasks] = await Promise.all([
    supabaseAdmin.from('contacts').select('id, contact_type, lead_status', { count: 'exact', head: false }),
    supabaseAdmin.from('companies').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('deals').select('id, stage, amount, probability'),
    supabaseAdmin.from('tasks').select('id, status', { count: 'exact', head: false }),
  ]);

  // Calculate stats
  const totalContacts = contacts.count || 0;
  const leads = contacts.data?.filter(c => c.contact_type === 'lead').length || 0;
  const customers = contacts.data?.filter(c => c.contact_type === 'customer').length || 0;
  
  const totalCompanies = companies.count || 0;
  
  const openDeals = deals.data?.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)) || [];
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.amount * (d.probability / 100)), 0);
  
  const wonDeals = deals.data?.filter(d => d.stage === 'closed_won').length || 0;
  const totalDealValue = deals.data?.filter(d => d.stage === 'closed_won')
    .reduce((sum, d) => sum + d.amount, 0) || 0;
  
  const pendingTasks = tasks.data?.filter(t => t.status === 'pending').length || 0;

  return {
    totalContacts,
    leads,
    customers,
    totalCompanies,
    openDeals: openDeals.length,
    pipelineValue,
    wonDeals,
    totalDealValue,
    pendingTasks,
  };
}

export default async function CRMDashboardPage() {
  await requirePermissionPage('crm.access');
  const stats = await getCRMStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Customer relationship management and sales pipeline overview
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.leads} leads, {stats.customers} customers
            </p>
            <Link
              href="/dashboard/crm/contacts"
              className="text-xs text-primary hover:underline mt-2 inline-block"
            >
              View all contacts →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Account records
            </p>
            <Link
              href="/dashboard/crm/companies"
              className="text-xs text-primary hover:underline mt-2 inline-block"
            >
              View companies →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.pipelineValue / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.openDeals} open deals
            </p>
            <Link
              href="/dashboard/crm/deals"
              className="text-xs text-primary hover:underline mt-2 inline-block"
            >
              View pipeline →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Won</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.wonDeals}</div>
            <p className="text-xs text-muted-foreground">
              ${(stats.totalDealValue / 1000).toFixed(1)}k total value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common CRM tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/dashboard/crm/contacts/new"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm font-medium">Add Contact</div>
              <div className="text-xs text-gray-500 mt-1">Create new lead</div>
            </Link>
            <Link
              href="/dashboard/crm/companies/new"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm font-medium">Add Company</div>
              <div className="text-xs text-gray-500 mt-1">New account</div>
            </Link>
            <Link
              href="/dashboard/crm/deals/new"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm font-medium">Create Deal</div>
              <div className="text-xs text-gray-500 mt-1">New opportunity</div>
            </Link>
            <Link
              href="/dashboard/crm/tasks"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm font-medium">My Tasks</div>
              <div className="text-xs text-gray-500 mt-1">{stats.pendingTasks} pending</div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Sales Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline</CardTitle>
          <CardDescription>Deals by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Prospecting</span>
              <span className="font-medium">View pipeline for details</span>
            </div>
            <Link
              href="/dashboard/crm/deals"
              className="text-sm text-primary hover:underline inline-block"
            >
              View full sales pipeline →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
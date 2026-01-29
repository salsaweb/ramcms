import { requirePermissionPage } from '@/lib/auth/session';
import { getDeals, getPipelineStats } from '@/app/actions/crm/deals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function DealsPage() {
  await requirePermissionPage('deals.read');
  
  const [dealsResult, statsResult] = await Promise.all([
    getDeals(),
    getPipelineStats(),
  ]);
  
  const deals = dealsResult.success && dealsResult.deals ? dealsResult.deals : [];
  const stats = statsResult.success ? statsResult.stats : null;

  // Group deals by stage
  const dealsByStage = deals.reduce((acc: any, deal: any) => {
    if (!acc[deal.stage]) {
      acc[deal.stage] = [];
    }
    acc[deal.stage].push(deal);
    return acc;
  }, {});

  const stages = [
    { key: 'prospecting', label: 'Prospecting', color: 'bg-gray-100 text-gray-800' },
    { key: 'qualification', label: 'Qualification', color: 'bg-blue-100 text-blue-800' },
    { key: 'proposal', label: 'Proposal', color: 'bg-yellow-100 text-yellow-800' },
    { key: 'negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-800' },
    { key: 'closed_won', label: 'Closed Won', color: 'bg-green-100 text-green-800' },
    { key: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deals Pipeline</h1>
          <p className="mt-2 text-gray-600">
            Manage your sales opportunities
          </p>
        </div>
        <Button>
          <Link href="/dashboard/crm/deals/new">Create Deal</Link>
        </Button>
      </div>

      {/* Pipeline Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(stats.pipelineValue / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-muted-foreground">
                Weighted by probability
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${(stats.wonThisMonth / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-muted-foreground">
                Closed won deals
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalOpenDeals}
              </div>
              <p className="text-xs text-muted-foreground">
                Active opportunities
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalOpenDeals > 0 ? ((stats.pipelineValue / stats.totalOpenDeals) / 1000).toFixed(1) : 0}k
              </div>
              <p className="text-xs text-muted-foreground">
                Average value
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pipeline Board */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline</CardTitle>
          <CardDescription>Drag deals through stages (coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stages.map((stage) => {
              const stageDeals = dealsByStage[stage.key] || [];
              const stageValue = stageDeals.reduce((sum: number, deal: any) => sum + deal.amount, 0);

              return (
                <div key={stage.key} className="space-y-3">
                  <div className="flex flex-col">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${stage.color} text-center`}>
                      {stage.label}
                    </span>
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      {stageDeals.length} deals • ${(stageValue / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <div className="space-y-2">
                    {stageDeals.length === 0 ? (
                      <div className="p-3 border border-dashed rounded text-xs text-gray-400 text-center">
                        No deals
                      </div>
                    ) : (
                      stageDeals.map((deal: any) => (
                        <Link
                          key={deal.id}
                          href={`/dashboard/crm/deals/${deal.id}`}
                          className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-sm truncate">{deal.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            ${deal.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {deal.probability}% • {deal.contacts?.first_name || 'No contact'}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* All Deals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Deals ({deals.length})</CardTitle>
          <CardDescription>Complete list of opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">No deals yet</p>
              <Button>
                <Link href="/dashboard/crm/deals/new">Create Your First Deal</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deal Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Probability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Close
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deals.map((deal: any) => (
                    <tr key={deal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/crm/deals/${deal.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {deal.name}
                        </Link>
                        {deal.companies?.name && (
                          <div className="text-xs text-gray-500">{deal.companies.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${deal.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          deal.stage === 'closed_won'
                            ? 'bg-green-100 text-green-800'
                            : deal.stage === 'closed_lost'
                            ? 'bg-red-100 text-red-800'
                            : deal.stage === 'negotiation'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {deal.stage.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">{deal.probability}%</span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${deal.probability}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {deal.contacts
                          ? `${deal.contacts.first_name} ${deal.contacts.last_name}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {deal.expected_close_date
                          ? new Date(deal.expected_close_date).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
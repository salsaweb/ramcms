import { requirePermissionPage } from '@/lib/auth/session';
import { getDeal } from '@/app/actions/crm/deals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DealStageUpdater } from '@/components/crm/deal-stage-updater';
import { DeleteDealButton } from '@/components/crm/delete-deal-button';

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage('deals.read');

  const { id } = await params;
  const deal = await getDeal(id);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/crm/deals">
            <Button variant="outline">← Back</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{deal.name}</h1>
            <p className="text-gray-600">${deal.amount.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/crm/deals/${deal.id}/edit`}>
            <Button>Edit Deal</Button>
          </Link>
          <DeleteDealButton dealId={deal.id} dealName={deal.name} />
        </div>
      </div>

      {/* Deal Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Deal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Amount</dt>
              <dd className="mt-1 text-2xl font-bold text-gray-900">
                ${deal.amount.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Probability</dt>
              <dd className="mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">{deal.probability}%</span>
                  <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full"
                      style={{ width: `${deal.probability}%` }}
                    ></div>
                  </div>
                </div>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Stage</dt>
              <dd className="mt-1">
                <DealStageUpdater dealId={deal.id} currentStage={deal.stage} />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Expected Close Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {deal.expected_close_date
                  ? new Date(deal.expected_close_date).toLocaleDateString()
                  : 'Not set'}
              </dd>
            </div>
            {deal.closed_date && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Closed Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(deal.closed_date).toLocaleDateString()}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Contact</dt>
              <dd className="mt-1">
                {deal.contacts ? (
                  <Link
                    href={`/dashboard/crm/contacts/${deal.contacts.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {deal.contacts.first_name} {deal.contacts.last_name}
                  </Link>
                ) : (
                  <span className="text-sm text-gray-500">No contact</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Company</dt>
              <dd className="mt-1">
                {deal.companies ? (
                  <Link
                    href={`/dashboard/crm/companies/${deal.companies.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {deal.companies.name}
                  </Link>
                ) : (
                  <span className="text-sm text-gray-500">No company</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Owner</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {deal.owner?.name || 'Unassigned'}
              </dd>
            </div>
            {deal.description && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{deal.description}</dd>
              </div>
            )}
            {deal.tags && deal.tags.length > 0 && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {deal.tags.map((tag: string) => (
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

      {/* Tasks */}
      {deal.tasks && deal.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tasks ({deal.tasks.length})</CardTitle>
            <CardDescription>Action items for this deal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deal.tasks.map((task: any) => (
                <div key={task.id} className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-gray-500 mt-1">{task.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      task.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : task.priority === 'urgent'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status === 'completed' ? 'Done' : task.priority}
                    </span>
                    {task.due_date && (
                      <span className="text-xs text-gray-500">
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>History of this deal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deal.activities && deal.activities.length === 0 ? (
              <p className="text-sm text-gray-500">No activities recorded yet</p>
            ) : (
              deal.activities.map((activity: any) => (
                <div key={activity.id} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          activity.activity_type === 'deal_stage_change'
                            ? 'bg-purple-100 text-purple-800'
                            : activity.activity_type === 'call'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.activity_type.replace('_', ' ')}
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
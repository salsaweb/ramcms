import { requirePermissionPage } from '@/lib/auth/session';
import { getContact } from '@/app/actions/crm/contacts';
import { getCallLogs, getOwnershipHistory } from '@/app/actions/crm/contact-advanced';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ContactActivityForm } from '@/components/crm/contact-activity-form';
import { CallLogForm } from '@/components/crm/call-log-form';
import { OwnershipTransferForm } from '@/components/crm/ownership-transfer-form';
import { ReminderForm } from '@/components/crm/reminder-form';
import { DeleteContactButton } from '@/components/crm/delete-contact-button';

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage('contacts.read');

  const { id } = await params;
  const [result, callLogsResult, ownershipResult, usersResult] = await Promise.all([
    getContact(id),
    getCallLogs(id),
    getOwnershipHistory(id),
    supabaseAdmin.from('users').select('id, name, email').eq('is_active', true),
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
  const activities = result.activities || [];
  const deals = result.deals || [];
  const tasks = result.tasks || [];
  const callLogs = callLogsResult.success ? callLogsResult.calls : [];
  const ownershipHistory = ownershipResult.success ? ownershipResult.history : [];
  const users = usersResult.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/crm/contacts">
            <Button variant="outline">← Back</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {contact.first_name} {contact.last_name}
            </h1>
            <p className="text-gray-600">{contact.job_title || contact.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/crm/contacts/${contact.id}/edit`}>
            <Button>Edit Contact</Button>
          </Link>
          <DeleteContactButton contactId={contact.id} contactName={`${contact.first_name} ${contact.last_name}`} />
        </div>
      </div>

      {/* Contact Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{contact.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{contact.phone || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Mobile</dt>
              <dd className="mt-1 text-sm text-gray-900">{contact.mobile || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Company</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contact.companies?.name || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Job Title</dt>
              <dd className="mt-1 text-sm text-gray-900">{contact.job_title || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  contact.contact_type === 'customer'
                    ? 'bg-green-100 text-green-800'
                    : contact.contact_type === 'lead'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {contact.contact_type}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  contact.lead_status === 'qualified'
                    ? 'bg-green-100 text-green-800'
                    : contact.lead_status === 'contacted'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {contact.lead_status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Lead Score</dt>
              <dd className="mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{contact.lead_score}</span>
                  <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2">
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
              </dd>
            </div>
            {contact.city && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {contact.city}
                  {contact.state && `, ${contact.state}`}
                  {contact.country && `, ${contact.country}`}
                </dd>
              </div>
            )}
            {contact.tags && contact.tags.length > 0 && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {contact.tags.map((tag: string) => (
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Perform common actions on this contact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CallLogForm contactId={contact.id} defaultPhone={contact.phone || contact.mobile} />
            <ReminderForm contactId={contact.id} users={users} />
            <OwnershipTransferForm
              contactId={contact.id}
              currentOwnerId={contact.owner_id}
              users={users}
            />
            <Link href="/dashboard/crm/contacts/duplicates">
              <Button variant="outline" size="sm" className="w-full">
                Check Duplicates
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Deals */}
      {deals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deals ({deals.length})</CardTitle>
            <CardDescription>Opportunities associated with this contact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deals.map((deal: any) => (
                <div key={deal.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        <Link href={`/dashboard/crm/deals/${deal.id}`}>{deal.name}</Link>
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{deal.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        ${deal.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">{deal.probability}% probability</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
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

      {/* Tasks */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Open Tasks ({tasks.length})</CardTitle>
            <CardDescription>Pending tasks for this contact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks.map((task: any) => (
                <div key={task.id} className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                     <div className="font-medium text-sm">
                      <Link href={`/dashboard/crm/tasks/${task.id}`}>{task.title}</Link>
                    </div>
                    {task.description && (
                      <div className="text-xs text-gray-500 mt-1">{task.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      task.priority === 'urgent'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span className="text-xs text-gray-500">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call Logs */}
      {callLogs && callLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Call History ({callLogs.length})</CardTitle>
            <CardDescription>Phone call logs with this contact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {callLogs.slice(0, 10).map((call: any) => (
                <div key={call.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          call.direction === 'inbound'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {call.direction === 'inbound' ? '📞 Incoming' : '📤 Outgoing'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          call.outcome === 'answered'
                            ? 'bg-green-100 text-green-800'
                            : call.outcome === 'voicemail'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {call.outcome}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {call.phone_number}
                        {call.duration_seconds && (
                          <span className="ml-2">
                            • {Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s
                          </span>
                        )}
                      </div>
                      {call.notes && (
                        <div className="mt-1 text-sm text-gray-700">{call.notes}</div>
                      )}
                      <div className="mt-1 text-xs text-gray-500">
                        by {call.caller?.name || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(call.call_datetime).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ownership History */}
      {ownershipHistory && ownershipHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ownership History</CardTitle>
            <CardDescription>Record of ownership transfers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ownershipHistory.map((history: any) => (
                <div key={history.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">{history.from_user?.name || 'Unknown'}</span>
                      {' → '}
                      <span className="font-medium">{history.to_user?.name || 'Unknown'}</span>
                      {history.transfer_reason && (
                        <div className="text-xs text-gray-600 mt-1">
                          Reason: {history.transfer_reason}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        by {history.transferred_by_user?.name || 'System'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(history.transferred_at).toLocaleDateString()}
                    </div>
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
          <CardDescription>Interaction history with this contact</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add Activity Form */}
          <ContactActivityForm contactId={contact.id} />

          {/* Activities List */}
          <div className="mt-6 space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-gray-500">No activities recorded yet</p>
            ) : (
              activities.map((activity: any) => (
                <div key={activity.id} className="border-l-2 border-gray-200 pl-4 pb-4">
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
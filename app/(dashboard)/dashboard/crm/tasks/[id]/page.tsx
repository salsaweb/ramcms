import { requirePermissionPage } from '@/lib/auth/session';
import { getTask } from '@/app/actions/crm/tasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TaskStatusToggle } from '@/components/crm/task-status-toggle';
import { DeleteTaskButton } from '@/components/crm/delete-task-button';

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage('tasks.read');

  const { id } = await params;
  const result = await getTask(id);

  if (!result.success || !result.task) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/crm/tasks">
            <Button variant="outline">← Back to Tasks</Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Task Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested task could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const task = result.task;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/crm/tasks">
            <Button variant="outline">← Back</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-gray-600 mt-1">
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                task.priority === 'urgent'
                  ? 'bg-red-100 text-red-800'
                  : task.priority === 'high'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {task.priority} priority
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/crm/tasks/${task.id}/edit`}>
            <Button>Edit Task</Button>
          </Link>
          <DeleteTaskButton taskId={task.id} taskTitle={task.title} />
        </div>
      </div>

      {/* Task Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <TaskStatusToggle taskId={task.id} currentStatus={task.status} />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Priority</dt>
              <dd className="mt-1">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  task.priority === 'urgent'
                    ? 'bg-red-100 text-red-800'
                    : task.priority === 'high'
                    ? 'bg-orange-100 text-orange-800'
                    : task.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {task.priority}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1">
                <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
                  {task.task_type}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Due Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString()
                  : 'Not set'}
              </dd>
            </div>
            {task.completed_at && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Completed At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(task.completed_at).toLocaleDateString()}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {task.assigned?.name || 'Unassigned'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {task.creator?.name || 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(task.created_at).toLocaleDateString()}
              </dd>
            </div>
            {task.description && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {task.description}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Related Records */}
      <Card>
        <CardHeader>
          <CardTitle>Related To</CardTitle>
          <CardDescription>Linked contacts, companies, and deals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {task.contacts && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium text-gray-500">Contact</div>
                <Link
                  href={`/dashboard/crm/contacts/${task.contacts.id}`}
                  className="text-primary hover:underline mt-1 block"
                >
                  {task.contacts.first_name} {task.contacts.last_name}
                </Link>
                {task.contacts.email && (
                  <div className="text-xs text-gray-500 mt-1">{task.contacts.email}</div>
                )}
              </div>
            )}
            {task.companies && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium text-gray-500">Company</div>
                <Link
                  href={`/dashboard/crm/companies/${task.companies.id}`}
                  className="text-primary hover:underline mt-1 block"
                >
                  {task.companies.name}
                </Link>
              </div>
            )}
            {task.deals && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium text-gray-500">Deal</div>
                <Link
                  href={`/dashboard/crm/deals/${task.deals.id}`}
                  className="text-primary hover:underline mt-1 block"
                >
                  {task.deals.name}
                </Link>
                <div className="text-xs text-gray-500 mt-1">
                  ${task.deals.amount.toLocaleString()}
                </div>
              </div>
            )}
            {!task.contacts && !task.companies && !task.deals && (
              <p className="text-sm text-gray-500">Not linked to any records</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
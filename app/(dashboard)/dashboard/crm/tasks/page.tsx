import { requirePermissionPage } from '@/lib/auth/session';
import { getTasks } from '@/app/actions/crm/tasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TaskStatusToggle } from '@/components/crm/task-status-toggle';

export default async function TasksPage() {
  await requirePermissionPage('tasks.read');
  
  const [allResult, pendingResult, completedResult] = await Promise.all([
    getTasks(),
    getTasks({ status: 'pending' }),
    getTasks({ status: 'completed', limit: 20 }),
  ]);
  
  const allTasks = allResult.success && allResult.tasks ? allResult.tasks : [];
  const pendingTasks = pendingResult.success && pendingResult.tasks ? pendingResult.tasks : [];
  const completedTasks = completedResult.success && completedResult.tasks ? completedResult.tasks : [];

  // Group pending tasks by priority
  const urgentTasks = pendingTasks.filter((t: any) => t.priority === 'urgent');
  const highTasks = pendingTasks.filter((t: any) => t.priority === 'high');
  const mediumTasks = pendingTasks.filter((t: any) => t.priority === 'medium');
  const lowTasks = pendingTasks.filter((t: any) => t.priority === 'low');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-2 text-gray-600">
            Manage your action items and to-dos
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/crm/tasks/new">Create Task</Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Active tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Recently completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Tasks */}
      {urgentTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Urgent Tasks ({urgentTasks.length})</CardTitle>
            <CardDescription className="text-red-700">
              Tasks that need immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentTasks.map((task: any) => (
                <div key={task.id} className="p-4 bg-white border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/dashboard/crm/tasks/${task.id}`}
                        className="font-medium text-gray-900 hover:text-primary"
                      >
                        {task.title}
                      </Link>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {task.contacts && (
                          <span>👤 {task.contacts.first_name} {task.contacts.last_name}</span>
                        )}
                        {task.companies && <span>🏢 {task.companies.name}</span>}
                        {task.deals && <span>💼 {task.deals.name}</span>}
                        {task.due_date && (
                          <span className="text-red-600 font-medium">
                            📅 Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <TaskStatusToggle taskId={task.id} currentStatus={task.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* High Priority Tasks */}
      {highTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>High Priority Tasks ({highTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {highTasks.map((task: any) => (
                <div key={task.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/dashboard/crm/tasks/${task.id}`}
                        className="font-medium text-gray-900 hover:text-primary"
                      >
                        {task.title}
                      </Link>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
                          {task.priority}
                        </span>
                        {task.contacts && (
                          <span>👤 {task.contacts.first_name} {task.contacts.last_name}</span>
                        )}
                        {task.due_date && (
                          <span>📅 {new Date(task.due_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <TaskStatusToggle taskId={task.id} currentStatus={task.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Pending Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>All Pending Tasks ({pendingTasks.length})</CardTitle>
          <CardDescription>Active tasks organized by priority</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingTasks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">No pending tasks</p>
              <Button asChild>
                <Link href="/dashboard/crm/tasks/new">Create Your First Task</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Related To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingTasks.map((task: any) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/crm/tasks/${task.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {task.title}
                        </Link>
                        {task.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
                          {task.task_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {task.contacts && (
                          <div>👤 {task.contacts.first_name} {task.contacts.last_name}</div>
                        )}
                        {task.companies && <div>🏢 {task.companies.name}</div>}
                        {task.deals && <div>💼 {task.deals.name}</div>}
                        {!task.contacts && !task.companies && !task.deals && '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TaskStatusToggle taskId={task.id} currentStatus={task.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Completed */}
      {completedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Completed</CardTitle>
            <CardDescription>Last 20 completed tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedTasks.map((task: any) => (
                <div key={task.id} className="p-3 border rounded-lg bg-green-50 opacity-75">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/dashboard/crm/tasks/${task.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary line-through"
                      >
                        {task.title}
                      </Link>
                      <div className="text-xs text-gray-500 mt-1">
                        Completed: {task.completed_at && new Date(task.completed_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-green-100 text-green-800">
                      ✓ Done
                    </span>
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
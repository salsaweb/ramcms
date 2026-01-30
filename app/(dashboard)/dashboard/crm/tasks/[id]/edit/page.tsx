import { requirePermissionPage } from '@/lib/auth/session';
import { getTask } from '@/app/actions/crm/tasks';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TaskForm } from '@/components/crm/task-form';

async function getFormData() {
  const [contacts, companies, deals, users] = await Promise.all([
    supabaseAdmin.from('contacts').select('id, first_name, last_name').order('first_name'),
    supabaseAdmin.from('companies').select('id, name').order('name'),
    supabaseAdmin.from('deals').select('id, name').order('name'),
    supabaseAdmin.from('users').select('id, name, email').eq('is_active', true).order('name'),
  ]);

  return {
    contacts: contacts.data || [],
    companies: companies.data || [],
    deals: deals.data || [],
    users: users.data || [],
  };
}

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage('tasks.update');

  const { id } = await params;
  const [result, formData] = await Promise.all([
    getTask(id),
    getFormData(),
  ]);

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
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/crm/tasks/${task.id}`}>
          <Button variant="outline">← Back to Task</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Task</h1>
          <p className="text-gray-600 mt-1">{task.title}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Information</CardTitle>
          <CardDescription>
            Update the task details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm
            contacts={formData.contacts}
            companies={formData.companies}
            deals={formData.deals}
            users={formData.users}
            initialData={{
              id: task.id,
              title: task.title,
              description: task.description || '',
              taskType: task.task_type,
              priority: task.priority,
              status: task.status,
              contactId: task.contact_id || '',
              companyId: task.company_id || '',
              dealId: task.deal_id || '',
              assignedTo: task.assigned_to || '',
              dueDate: task.due_date || '',
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
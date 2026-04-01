import { requirePermissionPage } from '@/lib/auth/session';
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

export default async function NewTaskPage() {
  await requirePermissionPage('tasks.create');
  const { contacts, companies, deals, users } = await getFormData();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm/tasks">
          <Button variant="outline">← Back to Tasks</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
          <p className="text-gray-600 mt-1">Add a new action item</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Information</CardTitle>
          <CardDescription>
            Fill in the details for the new task
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm
            contacts={contacts}
            companies={companies}
            deals={deals}
            users={users}
          />
        </CardContent>
      </Card>
    </div>
  );
}
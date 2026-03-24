'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTask, updateTask } from '@/app/actions/crm/tasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
}

interface Company {
  id: string;
  name: string;
}

interface Deal {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface TaskFormData {
  id?: string;
  title: string;
  description: string;
  taskType: 'call' | 'email' | 'meeting' | 'deadline' | 'follow_up' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  contactId: string;
  companyId: string;
  dealId: string;
  assignedTo: string;
  dueDate: string;
}

interface TaskFormProps {
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  users: User[];
  initialData?: TaskFormData;
}

export function TaskForm({ contacts, companies, deals, users, initialData }: TaskFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<TaskFormData>(
    initialData || {
      title: '',
      description: '',
      taskType: 'other',
      priority: 'medium',
      status: 'pending',
      contactId: '',
      companyId: '',
      dealId: '',
      assignedTo: '',
      dueDate: '',
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = initialData?.id
      ? await updateTask({ id: initialData.id, ...formData })
      : await createTask(formData);

    if (result.success) {
      if (initialData?.id) {
        router.push(`/dashboard/crm/tasks/${initialData.id}`);
      } else {
        router.push('/dashboard/crm/tasks');
      }
    } else {
      setError(result.error || 'Failed to save task');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Follow up on proposal"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
              placeholder="Add details about this task..."
            />
          </div>
        </div>
      </div>

      {/* Task Properties */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Task Properties</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="taskType" className="block text-sm font-medium text-gray-700 mb-1">
              Task Type
            </label>
            <select
              id="taskType"
              name="taskType"
              value={formData.taskType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="deadline">Deadline</option>
              <option value="follow_up">Follow Up</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Assignment */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Assignment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="">Assign to user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Related Records */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Link to Records (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="contactId" className="block text-sm font-medium text-gray-700 mb-1">
              Contact
            </label>
            <select
              id="contactId"
              name="contactId"
              value={formData.contactId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="">Select contact...</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <select
              id="companyId"
              name="companyId"
              value={formData.companyId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="">Select company...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dealId" className="block text-sm font-medium text-gray-700 mb-1">
              Deal
            </label>
            <select
              id="dealId"
              name="dealId"
              value={formData.dealId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="">Select deal...</option>
              {deals.map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData?.id ? 'Update Task' : 'Create Task'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
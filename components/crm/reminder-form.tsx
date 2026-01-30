'use client';

import { useState } from 'react';
import { createReminder } from '@/app/actions/crm/contact-advanced';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReminderFormProps {
  contactId?: string;
  companyId?: string;
  dealId?: string;
  users?: Array<{ id: string; name: string }>;
}

export function ReminderForm({ contactId, companyId, dealId, users = [] }: ReminderFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    reminderType: 'follow_up' as 'follow_up' | 'call' | 'email' | 'meeting' | 'deadline' | 'custom',
    title: '',
    description: '',
    reminderDate: '',
    reminderTime: '',
    assignedTo: '',
  });

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
    setSuccess(false);

    // Combine date and time
    const reminderDatetime = `${formData.reminderDate}T${formData.reminderTime}:00`;

    const result = await createReminder({
      contactId,
      companyId,
      dealId,
      reminderType: formData.reminderType,
      title: formData.title,
      description: formData.description,
      reminderDatetime,
      assignedTo: formData.assignedTo || undefined,
    });

    if (result.success) {
      setSuccess(true);
      setFormData({
        reminderType: 'follow_up',
        title: '',
        description: '',
        reminderDate: '',
        reminderTime: '',
        assignedTo: '',
      });
      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
      }, 2000);
    } else {
      setError(result.error || 'Failed to create reminder');
    }

    setLoading(false);
  };

  if (!showForm) {
    return (
      <div className="space-y-2">
        <Button onClick={() => setShowForm(true)} variant="outline" size="sm">
          ⏰ Set Reminder
        </Button>
        {success && (
          <Alert variant="success">
            <AlertDescription>Reminder created!</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-medium">Set Reminder</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="reminderType" className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            id="reminderType"
            name="reminderType"
            value={formData.reminderType}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
            disabled={loading}
          >
            <option value="follow_up">Follow Up</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
            <option value="deadline">Deadline</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {users.length > 0 && (
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              disabled={loading}
            >
              <option value="">Me (default)</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="reminderDate" className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <Input
            id="reminderDate"
            name="reminderDate"
            type="date"
            value={formData.reminderDate}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="reminderTime" className="block text-sm font-medium text-gray-700 mb-1">
            Time *
          </label>
          <Input
            id="reminderTime"
            name="reminderTime"
            type="time"
            value={formData.reminderTime}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>
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
          rows={2}
          className="w-full px-3 py-2 border rounded-md"
          disabled={loading}
          placeholder="Additional details..."
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Reminder'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowForm(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
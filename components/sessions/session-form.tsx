'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createSession, updateSession } from '@/app/actions/sessions';

interface SessionFormProps {
  initialData?: any;
  clients: { id: string; first_name: string; last_name: string; email: string }[];
  isEdit?: boolean;
}

export function SessionForm({ initialData, clients, isEdit = false }: SessionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Default time to 1 hour from now for new sessions, format for datetime-local input
  const getDefaultDateTime = () => {
    if (initialData?.scheduled_at) {
      return new Date(initialData.scheduled_at).toISOString().slice(0, 16);
    }
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
    return d.toISOString().slice(0, 16);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    
    // Ensure datetime is properly formatted for Postgres (add Z or convert to ISO)
    const localDateTime = formData.get('scheduledAt') as string;
    if (localDateTime) {
      const utcDate = new Date(localDateTime).toISOString();
      formData.set('scheduledAt', utcDate);
    }

    if (isEdit && initialData?.id) {
      formData.append('id', initialData.id);
    }

    const action = isEdit ? updateSession : createSession;
    const result = await action(formData);

    if (result.success) {
      router.push('/dashboard/sessions');
    } else {
      setError(result.error || 'Failed to save session');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 bg-card border rounded-lg p-6 max-w-2xl">
      {error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Basic details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="clientId">Client *</Label>
          <select
            id="clientId"
            name="clientId"
            required
            defaultValue={initialData?.client_id || ''}
            disabled={isEdit}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>Select a client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name} ({c.email || 'No email'})
              </option>
            ))}
          </select>
          {isEdit && (
            <p className="text-xs text-muted-foreground">Client cannot be changed after session creation.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Date & Time *</Label>
            <Input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              required
              defaultValue={getDefaultDateTime()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Duration (Minutes) *</Label>
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min="15"
              max="480"
              required
              defaultValue={initialData?.duration_minutes || 60}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <select
            id="status"
            name="status"
            required
            defaultValue={initialData?.status || 'confirmed'}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          >
            <option value="requested">Requested (Pending)</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-semibold text-muted-foreground">Notes</h3>
        
        <div className="space-y-2">
          <Label htmlFor="clientNotes">Client Notes (Shared)</Label>
          <Textarea
            id="clientNotes"
            name="clientNotes"
            rows={3}
            defaultValue={initialData?.client_notes || ''}
            placeholder="Notes visible to the client (e.g. preparation instructions)..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="internalNotes">Internal Notes (Private)</Label>
          <Textarea
            id="internalNotes"
            name="internalNotes"
            rows={3}
            defaultValue={initialData?.internal_notes || ''}
            placeholder="Your private notes about this session..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (isEdit ? 'Update Session' : 'Save Session')}
        </Button>
      </div>
    </form>
  );
}

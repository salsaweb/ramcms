'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { updateSettings } from '@/app/actions/settings';

interface SystemSettingsFormProps {
  settings: any[];
  roles: any[];
}

export function SystemSettingsForm({ settings, roles }: SystemSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const getSettingValue = (key: string) => {
    const setting = settings.find(s => s.key === key);
    // Values are stored as JSONB, strings come back with quotes sometimes, or as plain strings
    if (setting) {
      if (typeof setting.value === 'string') {
        return setting.value.replace(/^"|"$/g, '');
      }
      return setting.value;
    }
    return '';
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData(e.currentTarget);
    const updates = {
      default_practitioner_role_id: formData.get('default_practitioner_role_id') || null,
      default_participant_role_id: formData.get('default_participant_role_id') || null,
    };

    const result = await updateSettings(updates);
    
    if (result.success) {
      setMessage('Settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setError(result.error || 'Failed to update settings');
    }
    
    setLoading(false);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-100 text-green-800 p-3 rounded-md text-sm">
              {message}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Default Role Assignments</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="default_practitioner_role_id">Default Practitioner Role</Label>
                <select
                  id="default_practitioner_role_id"
                  name="default_practitioner_role_id"
                  defaultValue={getSettingValue('default_practitioner_role_id') || ''}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">-- No Default Role --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id.toString()}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Role assigned automatically when a new Practitioner user is created.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_participant_role_id">Default Participant/Client Role</Label>
                <select
                  id="default_participant_role_id"
                  name="default_participant_role_id"
                  defaultValue={getSettingValue('default_participant_role_id') || ''}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">-- No Default Role --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id.toString()}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Role assigned automatically when a new CRM contact turns into a system user.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

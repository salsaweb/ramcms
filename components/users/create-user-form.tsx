'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createUser } from '@/app/actions/users';
import { toast } from 'sonner';

export interface CreateUserFormProps {
  roles: { id: number; name: string }[];
}

export function CreateUserForm({ roles }: CreateUserFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const roleId = parseInt(
      (form.elements.namedItem('roleId') as HTMLSelectElement).value,
      10
    );

    const result = await createUser({ name, email, roleId });

    if (result.success) {
      toast.success('User invited successfully. An email has been sent.');
      router.push('/dashboard/users');
      router.refresh();
    } else {
      setError(result.error || 'Failed to create user');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            name="name"
            required
            minLength={2}
            placeholder="Jane Doe"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="jane@example.com"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="roleId">Role *</Label>
        <select
          id="roleId"
          name="roleId"
          required
          disabled={loading}
          defaultValue=""
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
        >
          <option value="" disabled>Select a role</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Role determines what permissions the user will have.
        </p>
      </div>

      <p className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/40">
        📧 An invitation email will be sent to the user. They will set their own password when accepting the invite.
      </p>

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
          {loading ? 'Sending Invite...' : 'Create & Send Invite'}
        </Button>
      </div>
    </form>
  );
}

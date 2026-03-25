'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient, updateClient } from '@/app/actions/clients';

interface ClientFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function ClientForm({ initialData, isEdit = false }: ClientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createAccount, setCreateAccount] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.append('createAccount', createAccount.toString());

    if (isEdit && initialData?.id) {
      formData.append('id', initialData.id);
    }

    const action = isEdit ? updateClient : createClient;
    const result = await action(formData);

    if (result.success) {
      router.push('/dashboard/clients');
    } else {
      setError(result.error || 'Failed to save client');
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            name="firstName"
            required
            defaultValue={initialData?.first_name || ''}
            placeholder="Jane"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            name="lastName"
            required
            defaultValue={initialData?.last_name || ''}
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={initialData?.email || ''}
            placeholder="jane@example.com"
            disabled={isEdit && initialData?.users} // Disable email change if linked to an account
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={initialData?.phone || ''}
            placeholder="+1 555-0123"
          />
        </div>
      </div>

      {!isEdit && (
        <div className="flex flex-col space-y-2 p-4 border rounded-md bg-muted/20">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="createAccount"
              checked={createAccount}
              onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
            />
            <Label htmlFor="createAccount" className="font-medium cursor-pointer">
              Create a Platform Account for this Client
            </Label>
          </div>
          <p className="text-sm text-muted-foreground ml-6">
            If checked, the client will receive an email invitation to log into the portal. They will be assigned the default Participant role. An email address must be provided above.
          </p>
        </div>
      )}

      {isEdit && initialData?.users && (
        <div className="p-4 border rounded-md bg-green-500/10 border-green-500/20">
          <p className="text-sm text-green-700 font-medium">
            This client is linked to a platform user account.
          </p>
        </div>
      )}

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-semibold text-muted-foreground">Social Networks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram Username</Label>
            <Input
              id="instagram"
              name="instagram"
              defaultValue={initialData?.custom_fields?.instagram || ''}
              placeholder="@username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitterHandle">X (Twitter) Handle</Label>
            <Input
              id="twitterHandle"
              name="twitterHandle"
              defaultValue={initialData?.twitter_handle || ''}
              placeholder="@username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebookUrl">Facebook URL</Label>
            <Input
              id="facebookUrl"
              name="facebookUrl"
              type="url"
              defaultValue={initialData?.facebook_url || ''}
              placeholder="https://facebook.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtube">YouTube URL</Label>
            <Input
              id="youtube"
              name="youtube"
              type="url"
              defaultValue={initialData?.custom_fields?.youtube || ''}
              placeholder="https://youtube.com/..."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              defaultValue={initialData?.linkedin_url || ''}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={initialData?.tags?.join(', ') || ''}
          placeholder="injury, vip, referral"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Client Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={initialData?.custom_fields?.notes || ''}
          placeholder="Add any specific health or personal notes here..."
        />
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
          {loading ? 'Saving...' : (isEdit ? 'Update Client' : 'Create Client')}
        </Button>
      </div>
    </form>
  );
}

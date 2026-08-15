'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient, updateClient } from '@/app/actions/clients';
import { useTranslations, useLocale } from 'next-intl';

interface ClientFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function ClientForm({ initialData, isEdit = false }: ClientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createAccount] = useState(false);
  const t = useTranslations('clients');
  const tError = useTranslations('errors');
  const tCommon = useTranslations('common');
  const locale = useLocale();

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
      router.push(`/${locale}/dashboard/clients`);
    } else {
      setError(result.error || tError('failedToSaveClient'));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 bg-card border rounded-lg p-6 max-w-5xl">
      {error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t('firstName')} *</Label>
          <Input
            id="firstName"
            name="firstName"
            required
            defaultValue={initialData?.first_name || ''}
            placeholder="Jane"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t('lastName')} *</Label>
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
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={initialData?.email || ''}
            placeholder="jane@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t('phone')}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={initialData?.phone || ''}
            placeholder="+1 555-0123"
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-semibold text-muted-foreground">Social Networks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instagram">{t('instagram')}</Label>
            <Input
              id="instagram"
              name="instagram"
              defaultValue={initialData?.custom_fields?.instagram || ''}
              placeholder="@username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitterHandle">{t('twitter')}</Label>
            <Input
              id="twitterHandle"
              name="twitterHandle"
              defaultValue={initialData?.twitter_handle || ''}
              placeholder="@username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebookUrl">{t('facebook')}</Label>
            <Input
              id="facebookUrl"
              name="facebookUrl"
              type="url"
              defaultValue={initialData?.facebook_url || ''}
              placeholder="https://facebook.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtube">{t('youtube')}</Label>
            <Input
              id="youtube"
              name="youtube"
              type="url"
              defaultValue={initialData?.custom_fields?.youtube || ''}
              placeholder="https://youtube.com/..."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="linkedinUrl">{t('linkedin')}</Label>
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
        <Label htmlFor="tags">{t('tags')}</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={initialData?.tags?.join(', ') || ''}
          placeholder="injury, vip, referral"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t('notes')}</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={initialData?.custom_fields?.notes || ''}
          placeholder={t('notesPlaceholder')}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t('saving') : (isEdit ? t('updateClient') : t('createClient'))}
        </Button>
      </div>
    </form>
  );
}

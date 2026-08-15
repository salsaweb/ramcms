'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCustomer, updateCustomer } from '@/app/actions/customers';
import { useTranslations, useLocale } from 'next-intl';
import { UserPlus } from 'lucide-react';

interface CustomerFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function CustomerForm({ initialData, isEdit = false }: CustomerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const t = useTranslations('customers');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.set('createAccount', createAccount.toString());

    if (isEdit && initialData?.id) {
      formData.set('id', initialData.id);
    }

    const action = isEdit ? updateCustomer : createCustomer;
    const result = await action(formData);

    if (result.success) {
      router.push(`/${locale}/dashboard/customers`);
      router.refresh();
    } else {
      setError(result.error || t('saveFailed'));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 bg-card border rounded-lg p-6 max-w-5xl">
      {error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">{error}</div>
      )}

      {/* Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Social */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-semibold text-muted-foreground">{t('socialNetworks')}</h3>
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

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">{t('tags')}</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={initialData?.tags?.join(', ') || ''}
          placeholder="vip, referral, enterprise"
        />
        <p className="text-xs text-muted-foreground">{t('tagsHint')}</p>
      </div>

      {/* Notes */}
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

      {/* Create user account toggle — only on create */}
      {!isEdit && (
        <div className="pt-4 border-t space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="createAccountCheckbox"
              checked={createAccount}
              onChange={(e) => setCreateAccount(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="createAccountCheckbox" className="cursor-pointer flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              {t('createAccount')}
            </Label>
          </div>
          {createAccount && (
            <p className="text-xs text-muted-foreground pl-7">{t('createAccountHint')}</p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? tCommon('saving')
            : isEdit
            ? t('updateCustomer')
            : t('createCustomer')}
        </Button>
      </div>
    </form>
  );
}

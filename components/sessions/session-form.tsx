'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createSession, updateSession } from '@/app/actions/sessions';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

interface SessionFormProps {
  initialData?: any;
  clients: { id: string; first_name: string; last_name: string; email: string }[];
  isEdit?: boolean;
}

export function SessionForm({ initialData, clients, isEdit = false }: SessionFormProps) {
  const router = useRouter();
  const t = useTranslations('session-form');
  const tClients = useTranslations('clients');
  const locale = useLocale();
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
      setError(result.error || t('failedToSave'));
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
          <Label htmlFor="clientId">{t('clientLabel')}</Label>
          <div className="flex items-center gap-2">
            <select
              id="clientId"
              name="clientId"
              required
              defaultValue={initialData?.client_id || ''}
              disabled={isEdit}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>{t('selectClient')}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.email || t('noEmail')})
                </option>
              ))}
            </select>
            {!isEdit && (
              <Button asChild variant="outline" className="h-10">
                <Link href={`/${locale}/dashboard/clients/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  {tClients('addClient')}
                </Link>
              </Button>
            )}
          </div>
          {isEdit && (
            <p className="text-xs text-muted-foreground">{t('clientCannotBeChanged')}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">{t('dateTimeLabel')}</Label>
            <Input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              disabled={isEdit && initialData?.status === 'completed'}
              required={!isEdit || initialData?.status !== 'completed'}
              defaultValue={getDefaultDateTime()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationMinutes">{t('durationLabel')}</Label>
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min="15"
              max="480"
              disabled={isEdit && initialData?.status === 'completed'}
              required={!isEdit || initialData?.status !== 'completed'}
              defaultValue={initialData?.duration_minutes || 60}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">{t('statusLabel')}</Label>
          <select
            id="status"
            name="status"
            disabled={isEdit && initialData?.status === 'completed'}
            required={!isEdit || initialData?.status !== 'completed'}
            defaultValue={initialData?.status || 'confirmed'}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          >
            <option value="requested">{t('statusRequested')}</option>
            <option value="confirmed">{t('statusConfirmed')}</option>
            <option value="completed">{t('statusCompleted')}</option>
            <option value="cancelled">{t('statusCancelled')}</option>
            <option value="no_show">{t('statusNoShow')}</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-semibold text-muted-foreground">{t('notesSection')}</h3>
        <input type="hidden" name="clientNotes" defaultValue={initialData?.client_notes || ''} />

        {/* <div className="space-y-2">
          <Label htmlFor="clientNotes">{t('clientNotesLabel')}</Label>
          <Textarea
            id="clientNotes"
            name="clientNotes"
            rows={3}
            defaultValue={initialData?.client_notes || ''}
            placeholder={t('clientNotesPlaceholder')}
          />
        </div> */}

        <div className="space-y-2">
          <Label htmlFor="internalNotes">{t('internalNotesLabel')}</Label>
          <Textarea
            id="internalNotes"
            name="internalNotes"
            rows={3}
            defaultValue={initialData?.internal_notes || ''}
            placeholder={t('internalNotesPlaceholder')}
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
          {t('cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t('saving') : (isEdit ? t('updateBtn') : t('saveBtn'))}
        </Button>
      </div>
    </form >
  );
}

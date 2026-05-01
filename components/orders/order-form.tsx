'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createOrder, updateOrder, type OrderStatus, type OrderType } from '@/app/actions/orders';
import { useTranslations, useLocale } from 'next-intl';
import { AlertTriangle } from 'lucide-react';

interface CustomerOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

interface OrderFormProps {
  initialData?: any;
  isEdit?: boolean;
  customers?: CustomerOption[];
  /** Pre-select a customer (e.g. when creating from customer profile) */
  defaultCustomerId?: string;
}

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: 'pilot', label: 'Pilot' },
  { value: 'method', label: 'Method' },
];

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'draft',       label: 'Draft' },
  { value: 'submitted',   label: 'Submitted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review',   label: 'In Review' },
  { value: 'delivered',   label: 'Delivered' },
  { value: 'cancelled',   label: 'Cancelled' },
];

export function OrderForm({
  initialData,
  isEdit = false,
  customers = [],
  defaultCustomerId,
}: OrderFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rushFlag, setRushFlag] = useState<boolean>(initialData?.rush_flag ?? false);
  const [createNewCustomer, setCreateNewCustomer] = useState(false);
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.set('rush_flag', rushFlag.toString());

    if (isEdit && initialData?.id) {
      formData.set('id', initialData.id);
    }

    const action = isEdit ? updateOrder : createOrder;
    const result = await action(formData);

    if (result.success) {
      const orderId = (result as any).orderId ?? initialData?.id;
      router.push(orderId ? `/${locale}/dashboard/orders/${orderId}` : `/${locale}/dashboard/orders`);
      router.refresh();
    } else {
      setError(result.error || t('saveFailed'));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 bg-card border rounded-lg p-6 max-w-4xl">
      {error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Type & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="type">{t('type')} *</Label>
          <select
            id="type"
            name="type"
            required
            defaultValue={initialData?.type || ''}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>{t('selectType')}</option>
            {ORDER_TYPES.map((ot) => (
              <option key={ot.value} value={ot.value}>{ot.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">{t('status')}</Label>
          <select
            id="status"
            name="status"
            defaultValue={initialData?.status || 'draft'}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {ORDER_STATUSES.map((os) => (
              <option key={os.value} value={os.value}>{os.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Customer */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-semibold">{t('customer')}</h3>

        {!createNewCustomer ? (
          <div className="space-y-2">
            <Label htmlFor="customer_id">{t('selectCustomer')}</Label>
            <select
              id="customer_id"
              name="customer_id"
              defaultValue={defaultCustomerId || initialData?.customer_id || ''}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t('noCustomer')}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}{c.email ? ` — ${c.email}` : ''}
                </option>
              ))}
            </select>
            {!isEdit && (
              <button
                type="button"
                onClick={() => setCreateNewCustomer(true)}
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                {t('createNewCustomer')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">{t('newCustomerHint')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new_customer_first">{t('firstName')} *</Label>
                <Input id="new_customer_first" name="new_customer_first" required placeholder="Jane" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_customer_last">{t('lastName')} *</Label>
                <Input id="new_customer_last" name="new_customer_last" required placeholder="Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_customer_email">{t('email')}</Label>
                <Input id="new_customer_email" name="new_customer_email" type="email" placeholder="jane@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_customer_phone">{t('phone')}</Label>
                <Input id="new_customer_phone" name="new_customer_phone" type="tel" placeholder="+1 555-0123" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreateNewCustomer(false)}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              {t('selectExistingCustomer')}
            </button>
          </div>
        )}
      </div>

      {/* Address & Description */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-semibold">{t('orderDetails')}</h3>

        <div className="space-y-2">
          <Label htmlFor="property_address">{t('propertyAddress')}</Label>
          <Input
            id="property_address"
            name="property_address"
            defaultValue={initialData?.property_address || ''}
            placeholder="123 Main St, Austin TX 78701"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('description')}</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={initialData?.description || ''}
            placeholder={t('descriptionPlaceholder')}
          />
        </div>
      </div>

      {/* Deadline & Rush */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-semibold">{t('scheduling')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="deadline">{t('deadline')}</Label>
            <Input
              id="deadline"
              name="deadline"
              type="date"
              defaultValue={initialData?.deadline?.slice(0, 10) || ''}
            />
          </div>

          <div className="flex items-center gap-3 pt-7">
            <input
              type="checkbox"
              id="rush_flag"
              checked={rushFlag}
              onChange={(e) => setRushFlag(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="rush_flag" className="cursor-pointer flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              {t('rushOrder')}
            </Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? tCommon('saving') : isEdit ? t('updateOrder') : t('createOrder')}
        </Button>
      </div>
    </form>
  );
}

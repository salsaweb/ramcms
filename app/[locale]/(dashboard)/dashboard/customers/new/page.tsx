import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { CustomerForm } from '@/components/customers/customer-form';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';

export default async function NewCustomerPage() {
  await requirePermissionPage(PERMISSIONS.CUSTOMERS_CREATE);

  const locale = await getLocale();
  const t = await getTranslations('customers');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/dashboard/customers`}
          className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('addCustomer')}</h1>
          <p className="text-muted-foreground mt-1">{t('createCustomerDescription')}</p>
        </div>
      </div>

      <CustomerForm />
    </div>
  );
}

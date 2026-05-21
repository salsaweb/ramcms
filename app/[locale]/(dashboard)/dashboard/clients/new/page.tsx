import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { ClientForm } from '@/components/clients/client-form';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';

export default async function NewClientPage() {
  const locale = await getLocale();
  const t = await getTranslations('clients');
  await requirePermissionPage(PERMISSIONS.DASHBOARD_ACCESS);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/dashboard/clients`}
          className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('addClient')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('createClientDescription')}
          </p>
        </div>
      </div>

      <ClientForm />
    </div>
  );
}

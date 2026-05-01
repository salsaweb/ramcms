import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getCustomers } from '@/app/actions/customers';
import { OrderForm } from '@/components/orders/order-form';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';

interface NewOrderPageProps {
  searchParams: Promise<{ customer?: string }>;
}

export default async function NewOrderPage({ searchParams }: NewOrderPageProps) {
  await requirePermissionPage(PERMISSIONS.ORDERS_CREATE);

  const { customer: preselectedCustomer } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations('orders');

  const customers = await getCustomers();

  const customerOptions = customers.map((c: any) => ({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/dashboard/orders`}
          className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('newOrder')}</h1>
          <p className="text-muted-foreground mt-1">{t('newOrderDescription')}</p>
        </div>
      </div>

      <OrderForm
        customers={customerOptions}
        defaultCustomerId={preselectedCustomer}
      />
    </div>
  );
}

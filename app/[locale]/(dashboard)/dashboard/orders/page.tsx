import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getOrders, type OrderStatus } from '@/app/actions/orders';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Package,
  AlertTriangle,
  MapPin,
  Calendar,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

export default async function OrdersPage() {
  await requirePermissionPage(PERMISSIONS.DASHBOARD_ACCESS);

  const locale = await getLocale();
  const t = await getTranslations('orders');
  const tCommon = await getTranslations('common');

  const { orders = [] } = await getOrders();

  const byStatus = (status: OrderStatus) => orders.filter((o) => o.status === status);
  const rushOrders = orders.filter((o) => o.rush_flag);

  const statusGroups: { label: string; status: OrderStatus; color: string }[] = [
    { label: 'Draft',       status: 'draft',       color: 'text-slate-600' },
    { label: 'Submitted',   status: 'submitted',   color: 'text-blue-600' },
    { label: 'In Progress', status: 'in_progress', color: 'text-amber-600' },
    { label: 'In Review',   status: 'in_review',   color: 'text-purple-600' },
    { label: 'Delivered',   status: 'delivered',   color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('orders')}</h1>
          <p className="text-muted-foreground mt-1">{t('ordersDescription')}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/orders/new`}>
            <Plus className="h-4 w-4 mr-2" />
            {t('newOrder')}
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {statusGroups.map(({ label, status, color }) => (
          <Card key={status}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className={`text-2xl font-bold ${color}`}>{byStatus(status).length}</div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Rush
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-amber-600">{rushOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Order List */}
      <Card>
        <CardContent className="pt-6">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">{t('noOrders')}</p>
              <p className="text-sm mt-1">{t('noOrdersHint')}</p>
              <Button asChild className="mt-4">
                <Link href={`/${locale}/dashboard/orders/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('newOrder')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => {
                const customer = (order as any).contacts;
                return (
                  <div
                    key={order.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <OrderStatusBadge status={order.status} />
                        <Badge variant="outline" className="text-xs capitalize">{order.type}</Badge>
                        {order.rush_flag && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold">
                            <AlertTriangle className="h-3 w-3" />
                            Rush
                          </span>
                        )}
                        {customer && (
                          <Link
                            href={`/${locale}/dashboard/customers/${customer.id}`}
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            {customer.first_name} {customer.last_name}
                          </Link>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {order.property_address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {order.property_address}
                          </span>
                        )}
                        {order.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Due {new Date(order.deadline).toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs opacity-60">
                          <Zap className="h-3 w-3" />
                          {t('lastSaved')} {new Date(order.last_saved_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" asChild className="shrink-0">
                      <Link href={`/${locale}/dashboard/orders/${order.id}`}>
                        {tCommon('view')}
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

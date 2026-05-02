import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getOrderById } from '@/app/actions/orders';
import { getCustomers } from '@/app/actions/customers';
import { OrderForm } from '@/components/orders/order-form';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { OrderStatusUpdateBadge } from '@/components/orders/order-status-update-badge';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Link2,
  FileText,
} from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  await requirePermissionPage(PERMISSIONS.DASHBOARD_ACCESS);

  const [order, customers] = await Promise.all([
    getOrderById(id),
    getCustomers(),
  ]);

  if (!order) notFound();

  const locale = await getLocale();
  const t = await getTranslations('orders');

  const customerData = (order as any).contacts;
  const customerOptions = customers.map((c: any) => ({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
  }));

  const assetUrls: string[] = order.assets?.urls || [];
  const assetKeys: string[] = order.assets?.keys || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/dashboard/orders`}
            className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight capitalize">{order.type} Order</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              ID: <code className="font-mono text-xs">{order.id}</code>
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details">
        <div className="space-y-2 w-full">
          <TabsList className="inline-flex border-b pb-1">
            <TabsTrigger value="details">{t('orderDetails')}</TabsTrigger>
            <TabsTrigger value="assets">
              {t('assets')}
              {assetUrls.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 text-primary text-xs px-1.5">
                  {assetUrls.length}
                </span>
              )}
            </TabsTrigger>
            {/* TabsTrigger value="edit">{tCommon('edit')}</TabsTrigger> */}
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Order Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t('orderInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('type')}</span>
                    <Badge variant="outline" className="capitalize">{order.type}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('status')}</span>
                    <OrderStatusUpdateBadge status={order.status} order={order as any} />
                  </div>
                  {order.deadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {t('deadline')}
                      </span>
                      <span>{new Date(order.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('customer')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {customerData ? (
                    <div className="space-y-2">
                      <Link
                        href={`/${locale}/dashboard/customers/${customerData.id}`}
                        className="font-medium hover:underline text-base"
                      >
                        {customerData.first_name} {customerData.last_name}
                      </Link>
                      {customerData.email && (
                        <p className="text-muted-foreground">{customerData.email}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{t('noCustomer')}</p>
                  )}
                </CardContent>
              </Card>

              {/* Location */}
              {order.property_address && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t('propertyAddress')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{order.property_address}</p>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('timestamps')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('createdAt')}</span>
                    <span>{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('lastSaved')}</span>
                    <span>{new Date(order.last_saved_at).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {order.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('description')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{order.description}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  {t('assets')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assetUrls.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Link2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t('noAssets')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assetUrls.map((url, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border rounded-lg text-sm">
                        <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          {assetKeys[i] && (
                            <p className="text-xs text-muted-foreground font-mono mb-0.5 truncate">
                              {assetKeys[i]}
                            </p>
                          )}
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate block"
                          >
                            {url}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit" className="mt-4">
            <OrderForm
              initialData={order}
              isEdit
              customers={customerOptions}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

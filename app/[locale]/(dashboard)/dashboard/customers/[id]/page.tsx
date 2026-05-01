import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getCustomerById } from '@/app/actions/customers';
import { getOrders } from '@/app/actions/orders';
import { CustomerForm } from '@/components/customers/customer-form';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  Mail,
  Phone,
  Package,
  Plus,
  UserCheck,
  AlertTriangle,
  MapPin,
  Calendar,
} from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';

interface CustomerProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerProfilePage({ params }: CustomerProfilePageProps) {
  const { id } = await params;
  await requirePermissionPage(PERMISSIONS.CUSTOMERS_READ);

  const [customer, ordersResult] = await Promise.all([
    getCustomerById(id),
    getOrders({ customerId: id }),
  ]);

  if (!customer) notFound();

  const locale = await getLocale();
  const t = await getTranslations('customers');
  const tOrders = await getTranslations('orders');
  const tCommon = await getTranslations('common');

  const orders = ordersResult.orders || [];
  const openOrders = orders.filter((o) =>
    ['draft', 'submitted', 'in_progress', 'in_review'].includes(o.status)
  );
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/dashboard/customers`}
            className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {customer.first_name} {customer.last_name}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              {t('customerProfile')}
              {(customer as any).users?.id && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <UserCheck className="h-3.5 w-3.5" />
                  {t('hasPortalAccess')}
                </span>
              )}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/orders/new?customer=${id}`}>
            <Plus className="h-4 w-4 mr-2" />
            {tOrders('newOrder')}
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <div className="space-y-2 w-full">
          <TabsList className="inline-flex border-b pb-1">
            <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
            <TabsTrigger value="orders">
              {tOrders('orders')}
              {orders.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 text-primary text-xs px-1.5">
                  {orders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="edit">{t('editDetails')}</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{tOrders('totalOrders')}</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{tOrders('openOrders')}</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{openOrders.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{tOrders('deliveredOrders')}</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{deliveredOrders.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('contactInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${customer.email}`} className="hover:underline">{customer.email}</a>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.tags && customer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {customer.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
                {!(customer as any).users?.id && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">{t('noPortalAccess')}</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${locale}/dashboard/customers/${id}/edit`}>
                        {t('grantPortalAccess')}
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{tOrders('orderHistory')}</CardTitle>
                    <CardDescription>{tOrders('orderHistoryDescription')}</CardDescription>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/${locale}/dashboard/orders/new?customer=${id}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      {tOrders('newOrder')}
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>{tOrders('noOrdersForCustomer')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <OrderStatusBadge status={order.status} />
                            <Badge variant="outline" className="text-xs capitalize">{order.type}</Badge>
                            {order.rush_flag && (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                                <AlertTriangle className="h-3 w-3" />
                                Rush
                              </span>
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
                                {new Date(order.deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/${locale}/dashboard/orders/${order.id}`}>
                            {tCommon('view')}
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit" className="mt-4">
            <CustomerForm initialData={customer} isEdit />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getCustomers } from '@/app/actions/customers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Plus, User, UserCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

export default async function CustomersPage() {
  await requirePermissionPage(PERMISSIONS.CUSTOMERS_READ);

  const customers = await getCustomers();
  const locale = await getLocale();
  const t = await getTranslations('customers');
  const tCommon = await getTranslations('common');

  const withAccount = customers.filter((c: any) => c.users?.id);
  const withoutAccount = customers.filter((c: any) => !c.users?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('customers')}</h1>
          <p className="text-muted-foreground mt-1">{t('customersDescription')}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/customers/new`}>
            <Plus className="h-4 w-4 mr-2" />
            {t('addCustomer')}
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalCustomers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('withPortalAccess')}</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center text-emerald-600">{withAccount.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('withoutPortalAccess')}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-center text-muted-foreground">{withoutAccount.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {customers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">{t('noCustomers')}</p>
              <p className="text-sm mt-1">{t('noCustomersHint')}</p>
              <Button asChild className="mt-4">
                <Link href={`/${locale}/dashboard/customers/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addCustomer')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {customers.map((customer: any) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {customer.first_name?.charAt(0)?.toUpperCase()}
                      {customer.last_name?.charAt(0)?.toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/${locale}/dashboard/customers/${customer.id}`}
                          className="font-medium hover:underline"
                        >
                          {customer.first_name} {customer.last_name}
                        </Link>
                        {customer.users?.id && (
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                            Portal
                          </Badge>
                        )}
                        {customer.tags?.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {customer.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </span>
                        )}
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <span className="text-xs text-muted-foreground hidden md:inline">
                      {tCommon('added')} {new Date(customer.created_at).toLocaleDateString()}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${locale}/dashboard/customers/${customer.id}`}>
                        {tCommon('view')}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

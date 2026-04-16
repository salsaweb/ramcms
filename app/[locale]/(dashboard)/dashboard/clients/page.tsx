import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getClients } from '@/app/actions/clients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Phone, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';

export default async function ClientsPage() {
  await requirePermissionPage(PERMISSIONS.DASHBOARD_ACCESS);
  const clients = await getClients();
  const locale = await getLocale();
  const t = await getTranslations('clients');
  const tCommon = await getTranslations('common');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('myClients')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('myClientsDescription')}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/clients/new`}>
            <Plus className="h-4 w-4 mr-2" />
            {t('addClient')}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalClients')}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="w-full text-2xl font-bold text-center">{clients.length}</div>
            <p className="w-full text-xs text-muted-foreground mt-1 text-center">
              {t('activeClients')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                className="pl-9"
              />
            </div>
            <Button variant="outline">{t('filtersBtn')}</Button>
          </div> */}

          {clients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">{t('noClients')}</p>
              <p className="text-sm mt-1">{t('noClientsDescription')}</p>
              <Button asChild className="mt-4">
                <Link href={`/${locale}/dashboard/clients/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addClient')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                      {client.first_name?.charAt(0) || client.email?.charAt(0)?.toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/${locale}/dashboard/clients/${client.id}`} className="font-medium hover:underline truncate">
                          {client.first_name} {client.last_name}
                        </Link>
                        {client.tags?.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {client.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </span>
                        )}
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-muted-foreground hidden md:inline-flex px-4">
                      {tCommon('added')} {new Date(client.created_at).toLocaleDateString()}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${locale}/dashboard/clients/${client.id}`}>
                        {tCommon('edit')}
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

import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getClients } from '@/app/actions/clients';
import { SessionForm } from '@/components/sessions/session-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

export default async function NewSessionPage() {
  await requirePermissionPage(PERMISSIONS.SESSIONS_CREATE);
  const t = await getTranslations('sessions');
  
  // Need to pass clients array so practitioner can select who the session is for
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('newTitle')}</h1>
        <p className="text-muted-foreground">
          {t('newDescription')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          {clients.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('noClientsTitle')}</CardTitle>
                <CardDescription>
                  {t('noClientsDesc')}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
             <SessionForm clients={clients} />
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-primary">{t('notificationsHeader')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('notificationsDesc')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

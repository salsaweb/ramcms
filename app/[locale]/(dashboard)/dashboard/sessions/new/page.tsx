import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getClients } from '@/app/actions/clients';
import { SessionForm } from '@/components/sessions/session-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function NewSessionPage() {
  await requirePermissionPage(PERMISSIONS.SESSIONS_CREATE);
  
  // Need to pass clients array so practitioner can select who the session is for
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schedule Session</h1>
        <p className="text-muted-foreground">
          Book a new Janzu session with an active client.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          {clients.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Clients Available</CardTitle>
                <CardDescription>
                  You must add a client to your CRM before you can schedule a session.
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
              <CardTitle className="text-lg text-primary">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                When you create a session, the client will immediately receive an email notification indicating their session status.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

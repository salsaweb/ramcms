import { requirePermissionPage, getSession } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function SettingsPage() {
  await requirePermissionPage(PERMISSIONS.SETTINGS_VIEW);
  const session = await getSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account and system settings
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your personal account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="mt-1 text-sm text-muted-foreground">{session?.user?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="mt-1 text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <p className="mt-1 text-sm text-muted-foreground capitalize">
                {session?.user?.roles?.[0] || 'User'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              Your current access permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {session?.user?.permissions?.map((permission) => (
                <Badge key={permission} variant="default">
                  {permission}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Password
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Last changed: Not available
                </p>
              </div>
              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Password change functionality coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              CMS version and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Version</span>
              <span className="text-sm text-muted-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Environment</span>
              <span className="text-sm text-muted-foreground">
                {process.env.NODE_ENV || 'development'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Database</span>
              <span className="text-sm text-muted-foreground">PostgreSQL (Supabase)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
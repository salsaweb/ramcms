import { requirePermissionPage } from '@/lib/auth/session';
import { getUserWithPermissions, getAllRoles } from '@/app/actions/user-management';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AssignRoleForm } from '@/components/users/assign-role-form';
import { RemoveRoleButton } from '@/components/users/remove-role-button';
import { UserStatusToggle } from '@/components/users/user-status-toggle';
import { Badge } from '@/components/ui/badge';

export default async function UserDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  await requirePermissionPage('users.read');
  
  const { id } = await params;
  
  const [userResult, rolesResult] = await Promise.all([
    getUserWithPermissions(id),
    getAllRoles(),
  ]);

  if (!userResult.success || !userResult.user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/users">
            <Button variant="outline">← Back to Users</Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested user could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = userResult.user;
  const availableRoles = rolesResult.success ? rolesResult.roles : [];
  const userRoleIds = user.roles?.map((r: any) => r.id) || [];
  const availableToAssign = availableRoles?.filter((r: any) => !userRoleIds.includes(r.id)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/users">
            <Button variant="outline">← Back</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <UserStatusToggle userId={user.id} isActive={user.is_active} />
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Name</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{user.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  user.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Member Since</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Roles Card */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Roles</CardTitle>
          <CardDescription>
            Roles determine what permissions this user has
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.roles && user.roles.length > 0 ? (
            <div className="space-y-2">
              {user.roles.map((role: any) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{role.name}</div>
                    {role.description && (
                      <div className="text-sm text-muted-foreground">{role.description}</div>
                    )}
                  </div>
                  <RemoveRoleButton userId={user.id} roleId={role.id} roleName={role.name} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No roles assigned</p>
          )}

          {availableToAssign && availableToAssign.length > 0 && (
            <div className="pt-4 border-t">
              <AssignRoleForm userId={user.id} availableRoles={availableToAssign} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Effective Permissions ({user.permissions?.length || 0})</CardTitle>
          <CardDescription>
            All permissions this user has through their assigned roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.permissions && user.permissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.permissions.map((perm: { permission_name: string }) => (
                <Badge key={perm.permission_name} variant="default">
                  {perm.permission_name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No permissions</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
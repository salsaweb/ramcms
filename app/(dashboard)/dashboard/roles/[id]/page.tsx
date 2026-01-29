import { requirePermissionPage } from '@/lib/auth/session';
import { getRoleWithPermissions, getAllPermissions } from '@/app/actions/user-management';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { RolePermissionsEditor } from '@/components/users/role-permissions-editor';

export default async function RoleDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  await requirePermissionPage('users.manage_roles');
  
  const { id } = await params;
  const roleId = parseInt(id);
  
  const [roleResult, permissionsResult] = await Promise.all([
    getRoleWithPermissions(roleId),
    getAllPermissions(),
  ]);

  if (!roleResult.success || !roleResult.role) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/roles">
            <Button variant="outline">← Back to Roles</Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Role Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested role could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const role = roleResult.role;
  const allPermissions = permissionsResult.success ? permissionsResult.permissions : [];
  const groupedPermissions = permissionsResult.success ? permissionsResult.grouped : {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/roles">
          <Button variant="outline">← Back</Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">{role.name}</h1>
            {role.is_system && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                System Role
              </span>
            )}
          </div>
          {role.description && (
            <p className="text-gray-600 mt-1">{role.description}</p>
          )}
        </div>
      </div>

      {/* Warning for system roles */}
      {role.is_system && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <svg
                className="h-5 w-5 text-yellow-600 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h3 className="font-medium text-yellow-900">System Role</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  This is a system role. Modifying its permissions may affect core application
                  functionality. Proceed with caution.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Permissions</CardTitle>
          <CardDescription>
            Select which permissions this role should have
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RolePermissionsEditor
            roleId={role.id}
            currentPermissions={role.permissions || []}
            allPermissions={allPermissions || []}
            groupedPermissions={groupedPermissions || {}}
          />
        </CardContent>
      </Card>

      {/* Current Permissions Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Permissions ({role.permissions?.length || 0})</CardTitle>
          <CardDescription>
            All permissions currently assigned to this role
          </CardDescription>
        </CardHeader>
        <CardContent>
          {role.permissions && role.permissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {role.permissions.map((perm: any) => (
                <div
                  key={perm.id}
                  className="px-3 py-2 bg-gray-50 rounded border text-sm"
                >
                  <div className="font-medium">{perm.name}</div>
                  {perm.description && (
                    <div className="text-xs text-gray-500 mt-1">{perm.description}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No permissions assigned</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
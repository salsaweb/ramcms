import { requirePermissionPage } from '@/lib/auth/session';
import { getAllRoles } from '@/app/actions/user-management';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function RolesPage() {
  await requirePermissionPage('users.manage_roles');
  
  const result = await getAllRoles();
  const roles = result.success ? result.roles : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
        <p className="mt-2 text-gray-600">
          Manage roles and their associated permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>
            Click on a role to edit its permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roles && roles.length > 0 ? (
              roles.map((role: any) => (
                <Link
                  key={role.id}
                  href={`/dashboard/roles/${role.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-lg">{role.name}</h3>
                        {role.is_system && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            System
                          </span>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {role.permissionCount} permissions
                      </div>
                      <div className="text-xs text-gray-500">Click to edit</div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500">No roles found</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Roles</strong> are collections of permissions. Users are assigned roles,
            and inherit all permissions from those roles.
          </p>
          <p>
            <strong>System roles</strong> are core roles that come with the application.
            While you can edit their permissions, exercise caution as this affects system functionality.
          </p>
          <p>
            <strong>Custom roles</strong> can be created for specific organizational needs
            (feature coming soon).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
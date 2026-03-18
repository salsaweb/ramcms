import { requirePermissionPage } from '@/lib/auth/session';
import { getAllRoles, getRoleTemplates } from '@/app/actions/rbac/custom-roles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateRoleButton } from '@/components/rbac/create-role-button';
import { RoleCard } from '@/components/rbac/role-card';
import { getJsonbArrayLength } from '@/lib/utils/jsonb';

export default async function RolesPage() {
  await requirePermissionPage('roles.read');

  const [rolesResult, templatesResult] = await Promise.all([
    getAllRoles(),
    getRoleTemplates(),
  ]);

  const roles = rolesResult.success ? rolesResult.roles : [];
  const templates = templatesResult.success ? templatesResult.templates : [];

  const systemRoles = roles.filter((r: any) => r.is_system);
  const customRoles = roles.filter((r: any) => !r.is_system);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="mt-2 text-gray-600">
            Manage user roles and their permissions
          </p>
        </div>
        <CreateRoleButton templates={templates} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">System Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemRoles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Custom Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customRoles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* System Roles */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Roles</h2>
        <p className="text-sm text-gray-600 mb-4">
          Built-in roles that cannot be deleted or renamed. Permissions can be modified.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {systemRoles.map((role: any) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      </div>

      {/* Custom Roles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Custom Roles</h2>
            <p className="text-sm text-gray-600 mt-1">
              User-created roles with custom permission sets
            </p>
          </div>
        </div>

        {customRoles.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="text-4xl mb-4">🎭</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Roles</h3>
                <p className="text-gray-600 mb-4">
                  Create custom roles to define specific permission sets for your team
                </p>
                <CreateRoleButton templates={templates} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customRoles.map((role: any) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        )}
      </div>

      {/* Role Templates */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Start Templates</CardTitle>
            <CardDescription>
              Pre-configured roles for common use cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {templates.map((template: any) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getJsonbArrayLength(template.template_permissions)} permissions included
                    </p>
                  </div>
                  <CreateRoleButton templates={templates} defaultTemplateId={template.id}>
                    <Button variant="outline" size="sm">
                      Use Template
                    </Button>
                  </CreateRoleButton>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Managing Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-blue-800">
            <p>• <strong>System Roles:</strong> Built-in roles (Admin, User). Can modify permissions but not delete.</p>
            <p>• <strong>Custom Roles:</strong> Create roles with specific permission sets for your organization.</p>
            <p>• <strong>Templates:</strong> Quick-start roles for common positions (Sales Rep, Manager, etc.).</p>
            <p>• <strong>Permissions:</strong> Click on any role to view and modify its permissions.</p>
            <p>• <strong>Clone:</strong> Duplicate existing roles to quickly create similar roles.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
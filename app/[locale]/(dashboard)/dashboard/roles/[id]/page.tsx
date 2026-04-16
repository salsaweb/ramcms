import { requirePermissionPage } from '@/lib/auth/session';
import { getRoleDetails, getAllPermissions } from '@/app/actions/rbac/custom-roles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PermissionManager } from '@/components/rbac/permission-manager';
import { RoleActions } from '@/components/rbac/role-actions';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage('roles.read');
  const t = await getTranslations('roles.details');

  const { id } = await params;
  const roleId = parseInt(id);

  if (isNaN(roleId)) {
    notFound();
  }

  const [roleResult, permissionsResult] = await Promise.all([
    getRoleDetails(roleId),
    getAllPermissions(),
  ]);

  if (!roleResult.success || !roleResult.role) {
    notFound();
  }

  const role = roleResult.role;
  const allPermissions = (permissionsResult.success ? permissionsResult.permissions : []) || [];

  // Extract current permission IDs
  const currentPermissions = role.role_permissions?.map((rp: any) => rp.permission) || [];
  const currentPermissionIds = currentPermissions.map((p: any) => p.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/roles">
            <Button variant="outline">{t('back')}</Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{role.name}</h1>
              {role.is_system && (
                <span className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                  {t('systemRole')}
                </span>
              )}
              {role.color && (
                <div
                  className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: role.color }}
                />
              )}
              {role.icon && (
                <span className="text-2xl">{role.icon}</span>
              )}
            </div>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{role.description || t('noDescription')}</p>
          </div>
        </div>
        <RoleActions role={role} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('permissions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPermissions.length}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('activePermissions')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('users')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{role.user_count || 0}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('usersWithRole')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('created')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(role.created_at).toLocaleDateString()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('updated', { date: new Date(role.updated_at).toLocaleDateString() })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warning for system roles */}
      {role.is_system && (
        <Card className="border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <svg
                className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5"
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
                <h3 className="font-medium text-yellow-900 dark:text-yellow-200">{t('systemRoleWarningTitle')}</h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                  {t('systemRoleWarningDesc')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permission Manager */}
      <PermissionManager
        roleId={roleId}
        roleName={role.name}
        isSystemRole={role.is_system}
        currentPermissionIds={currentPermissionIds}
        allPermissions={allPermissions}
      />

      {/* Audit Log */}
      {role.audit_log && role.audit_log.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('activityHistory')}</CardTitle>
            <CardDescription>{t('recentChanges')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {role.audit_log.slice(0, 10).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <div className="flex-shrink-0 w-20 text-gray-500 dark:text-gray-400">
                    {new Date(log.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium capitalize">{log.action.replace('_', ' ')}</span>
                    {log.user && (
                      <span className="text-gray-600 dark:text-gray-400"> {t('byUser', { user: log.user.name || log.user.email })}</span>
                    )}
                    {log.changes && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {JSON.stringify(log.changes)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Permissions Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('currentPermissions', { count: currentPermissions.length })}</CardTitle>
          <CardDescription>{t('allPermissionsGranted')}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentPermissions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('noPermissionsAssigned')}</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {currentPermissions.map((perm: any) => (
                <div
                  key={perm.id}
                  className="flex items-start gap-2 p-3 border rounded-lg border-gray-200 dark:border-gray-800"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{perm.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{perm.description}</div>
                    {perm.is_dangerous && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                        {t('dangerous')}
                      </span>
                    )}
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
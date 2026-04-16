import { requirePermissionPage } from '@/lib/auth/session';
import { getAllRoles, getRoleTemplates } from '@/app/actions/rbac/custom-roles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateRoleDialog } from '@/components/rbac/create-role-dialog';
import { RoleCard } from '@/components/rbac/role-card';
import { getJsonbArrayLength } from '@/lib/utils/jsonb';
import { getTranslations } from 'next-intl/server';

export default async function RolesPage() {
  await requirePermissionPage('roles.read');
  const t = await getTranslations('roles');

  const [rolesResult, templatesResult] = await Promise.all([
    getAllRoles(),
    getRoleTemplates(),
  ]);

  const roles = rolesResult.success && rolesResult.roles ? rolesResult.roles : [];
  const templates = templatesResult.success && templatesResult.templates ? templatesResult.templates : [];

  const systemRoles = roles.filter((r: any) => r.is_system);
  const customRoles = roles.filter((r: any) => !r.is_system);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <CreateRoleDialog 
          templates={templates} 
          trigger={<Button>{t('createRole')}</Button>} 
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('statTotalRoles')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('statSystemRoles')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemRoles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('statCustomRoles')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customRoles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('statTemplates')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* System Roles */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('systemRolesTitle')}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t('systemRolesDesc')}
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
            <h2 className="text-xl font-semibold">{t('customRolesTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t('customRolesDesc')}
            </p>
          </div>
        </div>

        {customRoles.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="text-4xl my-4">🎭</div>
                <h3 className="text-lg font-medium mb-2">{t('noCustomRoles')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('noCustomRolesDesc')}
                </p>
                <CreateRoleDialog 
                  templates={templates} 
                  trigger={<Button>{t('createRole')}</Button>} 
                />
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
            <CardTitle>{t('templatesTitle')}</CardTitle>
            <CardDescription>
              {t('templatesDesc')}
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
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getJsonbArrayLength(template.template_permissions)} {t('permissionsIncluded')}
                    </p>
                  </div>
                  <CreateRoleDialog 
                    templates={templates} 
                    defaultTemplateId={template.id}
                    trigger={<Button variant="outline" size="sm">
                      {t('useTemplate')}
                    </Button>} 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-400">{t('helpTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-blue-800 dark:text-blue-300">
            <p>• <strong>{t('helpSystemRolesTitle')}</strong> {t('helpSystemRoles')}</p>
            <p>• <strong>{t('helpCustomRolesTitle')}</strong> {t('helpCustomRoles')}</p>
            <p>• <strong>{t('helpTemplatesTitle')}</strong> {t('helpTemplates')}</p>
            <p>• <strong>{t('helpPermissionsTitle')}</strong> {t('helpPermissions')}</p>
            <p>• <strong>{t('helpCloneTitle')}</strong> {t('helpClone')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
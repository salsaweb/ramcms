import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getAllRoles } from '@/app/actions/rbac/custom-roles';
import { CreateUserForm } from '@/components/users/create-user-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NewUserPage() {
  await requirePermissionPage(PERMISSIONS.USERS_CREATE);
  
  const result = await getAllRoles();
  const roles = result.success && result.roles ? result.roles : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create User</h1>
        <p className="mt-2 text-muted-foreground">
          Add a new user to the system and assign a role
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>
            Enter the details for the new user. They will instantly be active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm roles={roles} />
        </CardContent>
      </Card>
    </div>
  );
}

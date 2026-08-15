import { getCurrentUser } from '@/lib/auth/session';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { checkPermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const isAdmin = await checkPermission(PERMISSIONS.USERS_READ);

  return (
    <DashboardLayout
      isAdmin={isAdmin}
      user={{
        name: user.name || 'User',
        email: user.email || 'user@example.com',
        avatar: user.avatarUrl ?? undefined,
      }}
    >
      {children}
    </DashboardLayout>
  );
}
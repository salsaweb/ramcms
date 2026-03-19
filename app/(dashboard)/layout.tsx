import { getCurrentUser } from '@/lib/auth/session';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <DashboardLayout
      user={{
        name: user.name || 'User',
        email: user.email || 'user@example.com',
        avatar: user.image,
      }}
    >
      {children}
    </DashboardLayout>
  );
}
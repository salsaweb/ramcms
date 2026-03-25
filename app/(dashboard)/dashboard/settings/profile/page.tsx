import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getMyProfile } from '@/app/actions/profile';
import { ProfileForm } from '@/components/settings/profile-form';

export default async function ProfilePage() {
  await requirePermissionPage(PERMISSIONS.DASHBOARD_ACCESS);
  const result = await getMyProfile();

  if (!result.success || !result.user) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Failed to load profile details.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      <ProfileForm 
        user={result.user} 
        participant={result.participant} 
        practitioner={result.practitioner} 
      />
    </div>
  );
}

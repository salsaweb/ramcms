import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getUsersWithoutPractitionerProfile } from '@/app/actions/practitioners';
import { PractitionerForm } from '@/components/practitioners/practitioner-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function CreatePractitionerPage() {
  await requirePermissionPage(PERMISSIONS.PRACTITIONERS_CREATE);
  
  const result = await getUsersWithoutPractitionerProfile();
  const availableUsers = result.success ? result.users : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/practitioners">
          <Button variant="outline">← Back</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add Practitioner</h1>
          <p className="text-muted-foreground">Create a new practitioner profile linked to a user</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <PractitionerForm availableUsers={availableUsers} isEdit={false} />
      </div>
    </div>
  );
}

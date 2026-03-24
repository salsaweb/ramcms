import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getPractitionerById } from '@/app/actions/practitioners';
import { PractitionerForm } from '@/components/practitioners/practitioner-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function EditPractitionerPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  await requirePermissionPage(PERMISSIONS.PRACTITIONERS_READ);
  
  const { id } = await params;
  const result = await getPractitionerById(id);

  if (!result.success || !result.practitioner) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/practitioners">
            <Button variant="outline">← Back to Practitioners</Button>
          </Link>
          <h1 className="text-3xl font-bold text-red-600">Practitioner Not Found</h1>
        </div>
      </div>
    );
  }

  const practitioner = result.practitioner;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/practitioners">
          <Button variant="outline">← Back</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{practitioner.users?.name || 'Unknown'}</h1>
          <p className="text-muted-foreground">Practitioner Profile</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <PractitionerForm initialData={practitioner} isEdit={true} />
      </div>
    </div>
  );
}

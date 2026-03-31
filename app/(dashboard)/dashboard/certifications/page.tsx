import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS, getUserPermissions } from '@/lib/rbac/permissions';
import { getCertificationProgress, getAllCertifications } from '@/app/actions/certifications';
import { PractitionerView } from '@/components/certifications/practitioner-view';
import { AdminView } from '@/components/certifications/admin-view';
import { redirect } from 'next/navigation';

export default async function CertificationsDashboardPage() {
  const sessionUser = await requirePermissionPage(PERMISSIONS.CERTIFICATIONS_READ);
  const permissions = await getUserPermissions(sessionUser.user.id);
  
  const canManage = permissions.includes(PERMISSIONS.CERTIFICATIONS_MANAGE);
  const canRequest = permissions.includes(PERMISSIONS.CERTIFICATIONS_REQUEST);

  if (!canManage && !canRequest) {
     redirect('/dashboard');
  }

  // Pre-fetch specific data based on role
  let practitionerProgress = null;
  let adminRequests = null;

  if (canManage) {
     const response = await getAllCertifications();
     adminRequests = response.success ? response.certifications : [];
  } 
  
  if (canRequest && !canManage) {
     // A practitioner seeing their own view
     const response = await getCertificationProgress();
     if (response.success) {
        practitionerProgress = {
           completedSessions: response.completedSessions || 0,
           certifications: response.certifications || []
        };
     }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certifications</h1>
          <p className="text-muted-foreground mt-1">
            {canManage ? 'Manage practitioner certification requests' : 'Track your certification journey'}
          </p>
        </div>
      </div>

      {canManage ? (
         <AdminView requests={adminRequests || []} />
      ) : practitionerProgress ? (
         <div className="max-w-2xl mx-auto py-8">
            <PractitionerView progress={practitionerProgress} />
         </div>
      ) : null}
      
    </div>
  );
}

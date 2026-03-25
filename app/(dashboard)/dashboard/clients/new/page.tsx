import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { ClientForm } from '@/components/clients/client-form';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function NewClientPage() {
  await requirePermissionPage(PERMISSIONS.DASHBOARD_ACCESS);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/clients"
          className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Client</h1>
          <p className="text-muted-foreground mt-1">
            Create a new client record in your practice
          </p>
        </div>
      </div>

      <ClientForm />
    </div>
  );
}

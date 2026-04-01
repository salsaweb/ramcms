import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { LocationForm } from '@/components/locations/location-form';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewLocationPage() {
  await requirePermissionPage(PERMISSIONS.LOCATIONS_CREATE);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/locations"
          className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Submit a Location</h1>
        </div>
      </div>
      
      <div className="pb-12">
        <LocationForm />
      </div>
    </div>
  );
}

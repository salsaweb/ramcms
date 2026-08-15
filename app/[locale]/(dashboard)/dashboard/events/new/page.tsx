import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { EventForm } from '@/components/events/event-form';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewEventPage({ params: { locale } }: { params: { locale: string } }) {
  await requirePermissionPage(PERMISSIONS.EVENTS_CREATE);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/dashboard/events`}
          className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Host an Event</h1>
        </div>
      </div>
      
      <div className="pb-12">
        <EventForm locale={locale} />
      </div>
    </div>
  );
}

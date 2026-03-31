import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS, getUserPermissions } from '@/lib/rbac/permissions';
import { getLocations } from '@/app/actions/locations';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Navigation } from 'lucide-react';
import Link from 'next/link';

export default async function LocationsDirectoryPage() {
  const sessionUser = await requirePermissionPage(PERMISSIONS.LOCATIONS_READ);
  const permissions = await getUserPermissions(sessionUser.user.id);
  const canManage = permissions.includes(PERMISSIONS.LOCATIONS_MANAGE);
  
  const response = await getLocations();
  const locations = response.success ? response.locations || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Water Locations</h1>
          <p className="text-muted-foreground mt-1">
            Discover and review warm water spots ideal for Janzu practice around the world.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/locations/new">
            <Plus className="h-4 w-4 mr-2" />
            Submit Location
          </Link>
        </Button>
      </div>

      {locations.length === 0 ? (
         <Card className="max-w-xl mx-auto mt-12 bg-muted/20 border-dashed">
            <CardContent className="text-center py-16">
               <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <MapPin className="h-10 w-10 text-primary opacity-80" />
               </div>
               <h3 className="text-xl font-semibold mb-2">The map is blank</h3>
               <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                 We're currently crowdsourcing the world's best warm water environments. Help the community by submitting the first one!
               </p>
               <Button asChild>
                 <Link href="/dashboard/locations/new">Submit a Pool or Cenote</Link>
               </Button>
            </CardContent>
         </Card>
      ) : (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {locations.map((loc) => {
                const isPending = loc.status === 'pending';
                const isRejected = loc.status === 'rejected';

                // Display badge for non-approved ones
                return (
                  <Card key={loc.id} className={`overflow-hidden flex flex-col transition-all hover:shadow-md ${isPending ? 'border-amber-200' : isRejected ? 'border-red-200 opacity-60' : ''}`}>
                     {loc.image_urls && loc.image_urls.length > 0 ? (
                        <div className="h-48 bg-slate-200 relative">
                           <img 
                              src={loc.image_urls[0]} 
                              alt={loc.name}
                              className="w-full h-full object-cover"
                           />
                           {isPending && (
                              <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
                                 Pending Review
                              </div>
                           )}
                           {isRejected && (
                              <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow">
                                 Rejected
                              </div>
                           )}
                        </div>
                     ) : (
                        <div className="h-48 bg-slate-100 flex items-center justify-center border-b relative">
                           <DropletsTypeIcon type={loc.type} />
                           {isPending && (
                              <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
                                 Pending Review
                              </div>
                           )}
                        </div>
                     )}
                     
                     <CardHeader className="pb-3 flex-1 flex-col">
                        <div className="flex justify-between items-start mb-1">
                           <CardTitle className="leading-tight text-xl">{loc.name}</CardTitle>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
                           <MapPin className="h-3.5 w-3.5 shrink-0" />
                           <span className="truncate">{loc.city ? `${loc.city}, ` : ''}{loc.country || 'Unknown location'}</span>
                        </div>
                     </CardHeader>
                     
                     <CardContent className="text-sm text-slate-600 line-clamp-3 mb-2 flex-grow">
                        {loc.description || "No description provided."}
                     </CardContent>
                     
                     <CardFooter className="pt-4 border-t bg-slate-50 mt-auto flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">{loc.type}</span>
                        <Button asChild size="sm" variant="secondary">
                           <Link href={`/dashboard/locations/${loc.id}`}>
                              {canManage && isPending ? 'Review Location' : 'View Details'} <Navigation className="ml-2 h-3 w-3" />
                           </Link>
                        </Button>
                     </CardFooter>
                  </Card>
                );
             })}
         </div>
      )}
    </div>
  );
}

// Helper icon component
function DropletsTypeIcon({ type }: { type: string }) {
  return (
     <div className="flex flex-col items-center text-slate-400 gap-2">
        <MapPin className="h-10 w-10 opacity-20" />
     </div>
  );
}

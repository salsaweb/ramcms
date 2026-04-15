import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getEvents } from '@/app/actions/events';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Plus, Navigation } from 'lucide-react';
import Link from 'next/link';

export default async function EventsDirectoryPage({ params: { locale } }: { params: { locale: string } }) {
  await requirePermissionPage(PERMISSIONS.EVENTS_READ);
  
  const response = await getEvents();
  const events = response.success ? response.events || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community Events</h1>
          <p className="text-muted-foreground mt-1 text-lg max-w-2xl">
            Join Janzu workshops, classes, and retreats happening around the globe.
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/events/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Host an Event
          </Link>
        </Button>
      </div>

      {events.length === 0 ? (
         <Card className="max-w-xl mx-auto mt-12 bg-muted/20 border-dashed">
            <CardContent className="text-center py-16">
               <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Calendar className="h-10 w-10 text-primary opacity-80" />
               </div>
               <h3 className="text-xl font-semibold mb-2">No upcoming events</h3>
               <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                 There are currently no public events scheduled. Be the first to host a Janzu workshop or class!
               </p>
               <Button asChild>
                 <Link href={`/${locale}/dashboard/events/new`}>Host an Event</Link>
               </Button>
            </CardContent>
         </Card>
      ) : (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {events.map((ev) => {
                const startDate = new Date(ev.start_date);
                
                const locationName = ev.locations 
                   ? `${ev.locations.name}, ${ev.locations.city || ev.locations.country}`
                   : ev.address || 'Location TBA';

                return (
                  <Card key={ev.id} className="overflow-hidden flex flex-col transition-all hover:shadow-md border-slate-200">
                     {ev.image_url ? (
                        <div className="h-48 bg-slate-200 relative">
                           <img 
                              src={ev.image_url} 
                              alt={ev.title}
                              className="w-full h-full object-cover"
                           />
                           <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-3 py-1.5 rounded shadow flex flex-col items-center">
                              <span className="uppercase text-[10px] text-slate-500">{startDate.toLocaleString('default', { month: 'short' })}</span>
                              <span className="text-lg leading-tight">{startDate.getDate()}</span>
                           </div>
                        </div>
                     ) : (
                        <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative border-b">
                           <Calendar className="h-12 w-12 text-primary opacity-30" />
                           <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-3 py-1.5 rounded shadow flex flex-col items-center">
                              <span className="uppercase text-[10px] text-slate-500">{startDate.toLocaleString('default', { month: 'short' })}</span>
                              <span className="text-lg leading-tight">{startDate.getDate()}</span>
                           </div>
                        </div>
                     )}
                     
                     <CardHeader className="pb-3 flex-1 flex-col pt-4">
                        <div className="flex justify-between items-start mb-2">
                           <Badge variant="outline" className="capitalize text-xs font-medium border-primary text-primary bg-primary/5">{ev.type}</Badge>
                        </div>
                        <CardTitle className="leading-tight text-xl mb-1">{ev.title}</CardTitle>
                        <div className="text-sm text-slate-600 flex items-center gap-1.5 mt-2">
                           <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                           <span className="truncate">{locationName}</span>
                        </div>
                     </CardHeader>
                     
                     <CardContent className="text-sm text-slate-600 line-clamp-2 mb-2 flex-grow">
                        {ev.description || "No description provided."}
                     </CardContent>
                     
                     <CardFooter className="pt-4 border-t bg-slate-50 mt-auto flex justify-between items-center px-6">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                           <Users className="h-4 w-4" />
                           {ev.attendeeCount} {ev.max_attendees ? `/ ${ev.max_attendees}` : ''} attending
                        </div>
                        <Button asChild size="sm" className="shrink-0">
                           <Link href={`/${locale}/dashboard/events/${ev.id}`}>
                              Details <Navigation className="ml-2 h-3 w-3" />
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

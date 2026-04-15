import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getEventById, submitRsvp } from '@/app/actions/events';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, Tag, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EventDetailPage({ params: { locale, id } }: { params: { locale: string, id: string } }) {
  await requirePermissionPage(PERMISSIONS.EVENTS_READ);

  const result = await getEventById(id);

  if (!result.success || !result.event) {
    notFound();
  }

  const ev = result.event as any;
  const isAttending = result.userRsvp === 'attending';
  
  const startDate = new Date(ev.start_date);
  const endDate = new Date(ev.end_date);
  
  const locationText = ev.locations 
    ? `${ev.locations.name}, ${ev.locations.city || ev.locations.country}`
    : ev.address || 'Location TBA';

  // Inline forms for RSVP
  async function handleJoin() {
     'use server';
     await submitRsvp(id, true);
  }

  async function handleLeave() {
     'use server';
     await submitRsvp(id, false);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/dashboard/events`}>
            &larr; Back to Events
          </Link>
        </Button>
      </div>

      {ev.image_url && (
         <div className="w-full h-64 md:h-96 rounded-xl overflow-hidden shadow-sm relative">
            <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
         </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
         <div className="space-y-2 flex-grow">
            <Badge variant="outline" className="capitalize text-sm font-medium border-primary text-primary bg-primary/5">
                <Tag className="h-3 w-3 mr-1" /> {ev.type}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">{ev.title}</h1>
            <p className="text-muted-foreground flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" /> {locationText}
            </p>
         </div>
         
         <div className="bg-white p-5 rounded-xl shadow-sm border md:min-w-[250px] w-full md:w-auto shrink-0 flex flex-col items-center">
             <div className="text-center mb-4">
                 <div className="text-sm text-slate-500 uppercase tracking-widest font-semibold mb-1">Status</div>
                 {isAttending ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-lg">
                        <CheckCircle2 className="h-5 w-5" /> You're Going
                    </div>
                 ) : (
                    <div className="text-slate-700 font-semibold text-lg">Not Attended</div>
                 )}
             </div>

             {isAttending ? (
                 <form action={handleLeave} className="w-full">
                     <Button type="submit" variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200">
                         Cancel RSVP
                     </Button>
                 </form>
             ) : (
                 <form action={handleJoin} className="w-full">
                     <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform active:scale-95">
                         RSVP Now
                     </Button>
                 </form>
             )}
             
             <div className="mt-4 pt-4 border-t w-full text-center text-sm text-muted-foreground flex justify-center items-center gap-2">
                 <Users className="h-4 w-4" /> 
                 {ev.attendeeCount || result.attendees?.length || 0} {ev.max_attendees ? `/ ${ev.max_attendees}` : ''} attending
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
         <div className="md:col-span-2 space-y-6">
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-xl">About This Event</CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line text-base">
                    {ev.description || 'No description provided.'}
                  </p>
               </CardContent>
            </Card>

            {/* Roster Visible to Admins and Event Owners */}
            {result.attendees && result.attendees.length > 0 && (
                <Card>
                   <CardHeader className="bg-slate-50 border-b">
                      <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5 text-slate-500" /> Attendance Roster
                      </CardTitle>
                   </CardHeader>
                   <CardContent className="p-0">
                      <div className="divide-y">
                          {result.attendees.map((r: any, idx: number) => (
                              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                  <div>
                                      <div className="font-medium">{r.users?.name || 'Unknown User'}</div>
                                      <div className="text-sm text-muted-foreground">{r.users?.email}</div>
                                  </div>
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                      Going
                                  </Badge>
                              </div>
                          ))}
                      </div>
                   </CardContent>
                </Card>
            )}
         </div>

         <div className="space-y-6">
            <Card>
               <CardHeader className="bg-primary/5 pb-4">
                  <CardTitle className="text-lg font-semibold">Event Details</CardTitle>
               </CardHeader>
               <CardContent className="pt-6 space-y-5">
                  <div className="flex gap-3">
                     <div className="bg-slate-100 p-2 rounded shrink-0 h-9 w-9 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-slate-600" />
                     </div>
                     <div>
                        <p className="text-sm font-semibold text-slate-900">Date</p>
                        <p className="text-sm text-slate-600 block">{startDate.toLocaleDateString()}</p>
                        {startDate.toDateString() !== endDate.toDateString() && (
                            <p className="text-sm text-slate-600 block">to {endDate.toLocaleDateString()}</p>
                        )}
                     </div>
                  </div>
                  
                  <div className="flex gap-3">
                     <div className="bg-slate-100 p-2 rounded shrink-0 h-9 w-9 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-slate-600" />
                     </div>
                     <div>
                        <p className="text-sm font-semibold text-slate-900">Time</p>
                        <p className="text-sm text-slate-600">
                           {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                     </div>
                  </div>

                  <div className="flex gap-3">
                     <div className="bg-slate-100 p-2 rounded shrink-0 h-9 w-9 flex items-center justify-center">
                        <Tag className="h-5 w-5 text-slate-600" />
                     </div>
                     <div>
                        <p className="text-sm font-semibold text-slate-900">Price</p>
                        <p className="text-sm text-slate-600 leading-tight">{ev.price_guide || 'Free / Not Specified'}</p>
                     </div>
                  </div>
               </CardContent>
            </Card>
            
            <div className="text-center text-xs text-muted-foreground">
               Hosted by {ev.users?.name || 'Unknown User'}<br/>
               <Link href={`/${locale}/dashboard/practitioners`} className="text-primary hover:underline">View Organizer Profile</Link>
            </div>
         </div>
      </div>
    </div>
  );
}

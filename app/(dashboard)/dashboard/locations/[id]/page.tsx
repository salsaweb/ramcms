import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS, getUserPermissions } from '@/lib/rbac/permissions';
import { getLocationById, reviewLocation } from '@/app/actions/locations';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowLeft, Droplets, ThermometerSun, DollarSign, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export default async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await requirePermissionPage(PERMISSIONS.LOCATIONS_READ);
  const permissions = await getUserPermissions(sessionUser.user.id);
  const canManage = permissions.includes(PERMISSIONS.LOCATIONS_MANAGE);

  const { id } = await params;
  const result = await getLocationById(id);

  if (!result.success || !result.location) {
    notFound();
  }

  const loc = result.location as any;
  const isPending = loc.status === 'pending';
  const isRejected = loc.status === 'rejected';

  // Inline forms for Admin logic
  async function handleApprove() {
     'use server';
     const fd = new FormData();
     fd.append('id', loc.id);
     fd.append('status', 'approved');
     fd.append('adminNotes', 'Location verified.');
     await reviewLocation(fd);
  }

  async function handleReject() {
     'use server';
     const fd = new FormData();
     fd.append('id', loc.id);
     fd.append('status', 'rejected');
     fd.append('adminNotes', 'Rejected per community guidelines.');
     await reviewLocation(fd);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/locations">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      {/* ADMIN BANNER */}
      {canManage && isPending && (
         <Card className="bg-amber-50 border-amber-200 shadow-sm">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                     <AlertCircle className="h-5 w-5 text-amber-600" />
                     Pending Administrator Review
                  </h3>
                  <p className="text-sm text-amber-700/80 mt-1 max-w-xl">
                    This location was submitted by <strong>{loc.users?.name || 'Unknown'}</strong>. Review the data and approve it for public dictionary viewing, or reject it.
                  </p>
               </div>
               <div className="flex gap-2 shrink-0">
                  <form action={handleReject}>
                     <Button type="submit" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50">Reject Spot</Button>
                  </form>
                  <form action={handleApprove}>
                     <Button type="submit" className="bg-amber-600 hover:bg-amber-700">Approve & Publish</Button>
                  </form>
               </div>
            </CardContent>
         </Card>
      )}

      {/* REJECTED BANNER */}
      {isRejected && (
         <Card className="bg-red-50 border-red-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
               <div className="text-red-800">
                  <span className="font-semibold block">Application Rejected</span>
                  {loc.admin_notes && (
                     <p className="text-sm mt-1">Admin note: "{loc.admin_notes}"</p>
                  )}
               </div>
            </CardContent>
         </Card>
      )}

      {loc.image_urls && loc.image_urls.length > 0 && (
         <div className="w-full h-64 md:h-96 rounded-xl overflow-hidden shadow-sm relative">
            <img src={loc.image_urls[0]} alt={loc.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
                <Badge className="mb-3 uppercase tracking-wider">{loc.type}</Badge>
                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight drop-shadow">{loc.name}</h1>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 space-y-6">
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-xl">About This Location</CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line text-lg">
                    {loc.description || 'No description provided.'}
                  </p>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="border-b bg-slate-50">
                  <CardTitle className="text-lg">Address & Coordinates</CardTitle>
               </CardHeader>
               <CardContent className="pt-6">
                  <div className="flex gap-3 text-slate-700 mb-4">
                     <MapPin className="h-5 w-5 shrink-0 text-slate-400" />
                     <div className="grid gap-1">
                        <span className="font-medium text-lg">{loc.address || 'Address not listed'}</span>
                        <span className="text-muted-foreground">{loc.city ? `${loc.city}, ` : ''}{loc.country}</span>
                     </div>
                  </div>
                  {(loc.latitude !== null && loc.longitude !== null) && (
                     <div className="bg-slate-100 p-4 rounded-lg flex items-center justify-between">
                        <code className="text-slate-600 font-mono text-sm">{loc.latitude}, {loc.longitude}</code>
                        <Button variant="outline" size="sm" asChild>
                           <a href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`} target="_blank" rel="noreferrer">
                              Open Maps
                           </a>
                        </Button>
                     </div>
                  )}
               </CardContent>
            </Card>
         </div>

         <div className="space-y-6">
            <Card>
               <CardHeader className="bg-primary/5 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                     <Info className="h-5 w-5 text-primary" /> At a Glance
                  </CardTitle>
               </CardHeader>
               <CardContent className="pt-6 space-y-5">
                  <div className="flex gap-3">
                     <div className="bg-slate-100 p-2 rounded shrink-0">
                        <Droplets className="h-5 w-5 text-blue-600" />
                     </div>
                     <div>
                        <p className="text-sm font-semibold text-slate-900">Water Type</p>
                        <p className="text-sm text-slate-600 capitalize">{loc.type}</p>
                     </div>
                  </div>
                  
                  <div className="flex gap-3">
                     <div className="bg-slate-100 p-2 rounded shrink-0">
                        <ThermometerSun className="h-5 w-5 text-orange-500" />
                     </div>
                     <div>
                        <p className="text-sm font-semibold text-slate-900">Average Temp</p>
                        <p className="text-sm text-slate-600">{loc.water_temperature || 'Unknown'}</p>
                     </div>
                  </div>

                  <div className="flex gap-3">
                     <div className="bg-slate-100 p-2 rounded shrink-0">
                        <DollarSign className="h-5 w-5 text-green-600" />
                     </div>
                     <div>
                        <p className="text-sm font-semibold text-slate-900">Price Guide</p>
                        <p className="text-sm text-slate-600 leading-tight">{loc.price_guide || 'Unknown'}</p>
                     </div>
                  </div>
               </CardContent>
            </Card>
            
            <div className="text-center text-xs text-muted-foreground">
               Submitted on {new Date(loc.created_at).toLocaleDateString()}
               <br />by {loc.users?.name || 'Unknown User'}
            </div>
         </div>
      </div>
    </div>
  );
}

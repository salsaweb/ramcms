import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getAllNotifications } from '@/app/actions/notifications';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Info, Calendar, MessageSquare, Award, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function NotificationsLogPage({ params: { locale } }: { params: { locale: string } }) {
  await requirePermissionPage(PERMISSIONS.NOTIFICATIONS_READ);

  const result = await getAllNotifications();
  const notifications = result.success ? result.notifications || [] : [];

  function getIcon(type: string) {
    switch (type) {
        case 'session_request': return <Clock className="h-5 w-5 text-blue-500" />;
        case 'feedback': return <MessageSquare className="h-5 w-5 text-emerald-500" />;
        case 'certification': return <Award className="h-5 w-5 text-amber-500" />;
        case 'event': return <Calendar className="h-5 w-5 text-purple-500" />;
        default: return <Info className="h-5 w-5 text-slate-500" />;
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications Log</h1>
        <p className="text-muted-foreground mt-1">Review your historical alerts and messages.</p>
      </div>

      {notifications.length === 0 ? (
         <Card className="bg-slate-50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-24 text-slate-500">
               <Bell className="h-12 w-12 opacity-20 mb-4" />
               <p className="font-medium text-lg">Your inbox is clear</p>
               <p className="text-sm">You'll receive an alert here when clients submit forms or book sessions.</p>
            </CardContent>
         </Card>
      ) : (
         <div className="bg-white rounded-xl border shadow-sm divide-y">
            {notifications.map((n) => (
                <div key={n.id} className={`p-6 flex flex-col md:flex-row gap-4 items-start md:items-center hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-primary/[0.02]' : ''}`}>
                    <div className={`shrink-0 p-3 rounded-full border ${!n.is_read ? 'bg-white shadow-sm border-primary/20' : 'bg-slate-50 border-slate-100'}`}>
                        {getIcon(n.type)}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                           <h3 className={`text-base ${!n.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                              {n.title}
                           </h3>
                           {!n.is_read && <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">New</span>}
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">{n.message}</p>
                        <p className="text-xs text-slate-400 font-medium">
                           {new Date(n.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                    </div>

                    {n.link_url && (
                        <div className="pt-2 md:pt-0 shrink-0 self-end md:self-center">
                           <Button variant={n.is_read ? "outline" : "default"} size="sm" asChild>
                               <Link href={n.link_url.startsWith('/dashboard') ? `/${locale}${n.link_url}` : n.link_url}>
                                   View Details <ArrowRight className="h-3 w-3 ml-2" />
                               </Link>
                           </Button>
                        </div>
                    )}
                </div>
            ))}
         </div>
      )}
    </div>
  );
}

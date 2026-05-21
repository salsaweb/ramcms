'use client';

import { useState, useEffect } from 'react';
import { Bell, Info, Calendar, MessageSquare, Award, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getUnreadNotificationsCount, getRecentNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '@/app/actions/notifications';
import { useRouter } from 'next/navigation';

export function NotificationBell({ locale }: { locale: string }) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initial fetch
  useEffect(() => {
    async function loadInitialCount() {
       const res = await getUnreadNotificationsCount();
       if (res.success && typeof res.count === 'number') {
           setUnreadCount(res.count);
       }
    }
    loadInitialCount();
  }, []);

  // Fetch populated details when Popover opens
  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  async function loadNotifications() {
      setLoading(true);
      const res = await getRecentNotifications(5);
      if (res.success && res.notifications) {
          setNotifications(res.notifications);
      }
      setLoading(false);
  }

  async function handleMarkAllRead() {
     await markAllNotificationsAsRead();
     setUnreadCount(0);
     setNotifications(prev => prev.map(n => ({...n, is_read: true})));
  }

  async function handleMarkReadAndGo(id: string, url: string | null) {
      setOpen(false);
      await markNotificationAsRead(id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      if (url) {
          // If the url is just a relative dashboard path, prefix locale
          if (url.startsWith('/dashboard')) {
              router.push(`/${locale}${url}`);
          } else {
              router.push(url);
          }
      }
  }

  function getIcon(type: string) {
      switch (type) {
          case 'session_request': return <Clock className="h-4 w-4 text-blue-500" />;
          case 'feedback': return <MessageSquare className="h-4 w-4 text-emerald-500" />;
          case 'certification': return <Award className="h-4 w-4 text-amber-500" />;
          case 'event': return <Calendar className="h-4 w-4 text-purple-500" />;
          default: return <Info className="h-4 w-4 text-slate-500" />;
      }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80 p-0 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
           <h4 className="font-semibold text-sm">Notifications</h4>
           {unreadCount > 0 && (
             <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary hover:bg-transparent hover:underline" onClick={handleMarkAllRead}>
                Mark all read
             </Button>
           )}
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
               <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
            ) : notifications.length === 0 ? (
               <div className="p-8 text-center text-sm text-slate-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  No new notifications
               </div>
            ) : (
               <div className="flex flex-col divide-y">
                  {notifications.map(n => (
                      <div 
                         key={n.id} 
                         className={`p-4 flex gap-3 hover:bg-slate-50 cursor-pointer transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                         onClick={() => handleMarkReadAndGo(n.id, n.link_url)}
                      >
                          <div className={`mt-1 shrink-0 h-8 w-8 rounded-full flex items-center justify-center border ${!n.is_read ? 'bg-white border-primary/20' : 'bg-slate-100 border-transparent'}`}>
                             {getIcon(n.type)}
                          </div>
                          <div className="space-y-1">
                             <p className={`text-sm leading-tight ${!n.is_read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                {n.title}
                             </p>
                             <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                {n.message}
                             </p>
                             <p className="text-[10px] text-slate-400 mt-1">
                                {new Date(n.created_at).toLocaleDateString()}
                             </p>
                          </div>
                          {!n.is_read && (
                             <div className="w-2 h-2 rounded-full bg-primary shrink-0 self-center ml-auto shadow-sm" />
                          )}
                      </div>
                  ))}
               </div>
            )}
        </div>
        
        <div className="p-2 border-t bg-slate-50">
           <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500" asChild onClick={() => setOpen(false)}>
              <Link href={`/${locale}/dashboard/notifications`}>View all notifications</Link>
           </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getSessions } from '@/app/actions/sessions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, Video, MessageSquareCheck, MessageSquareDashed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function SessionsPage() {
  await requirePermissionPage(PERMISSIONS.SESSIONS_READ);
  const response = await getSessions();
  const sessions = response.success ? response.sessions || [] : [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'requested': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': 
      case 'no_show': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your past and upcoming Janzu sessions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sessions/new">
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.status === 'requested').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No sessions scheduled.</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/sessions/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule One
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">
                        {session.contacts?.first_name} {session.contacts?.last_name}
                      </h3>
                      <Badge variant={getStatusBadgeVariant(session.status)} className="capitalize px-2 py-0 border-primary/20">
                        {session.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(session.scheduled_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(session.scheduled_at).toLocaleTimeString(undefined, { timeStyle: 'short' })} ({session.duration_minutes} min)
                      </span>
                      {session.session_feedback && (Array.isArray(session.session_feedback) ? session.session_feedback.length > 0 : Object.keys(session.session_feedback).length > 0) ? (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <MessageSquareCheck className="h-3.5 w-3.5" />
                          Feedback Provided
                        </span>
                      ) : session.status === 'completed' ? (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <MessageSquareDashed className="h-3.5 w-3.5" />
                          Pending Feedback
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:justify-end shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/sessions/${session.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

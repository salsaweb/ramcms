import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getSessions } from '@/app/actions/sessions';
import { getAllPractitionersForFilter } from '@/app/actions/feedback';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, Video, MessageSquareCheck, MessageSquareDashed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FeedbackLinkButton } from '@/components/feedback/feedback-link-button';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { FacilitatorFilter } from '../feedback/facilitator-filter';

interface PageProps {
  searchParams: Promise<{ practitionerId?: string }>;
}

export default async function SessionsPage({ searchParams }: PageProps) {
  await requirePermissionPage(PERMISSIONS.SESSIONS_READ);

  const { practitionerId } = await searchParams;
  const t = await getTranslations('sessions');
  const tFeedback = await getTranslations('feedback');
  const locale = await getLocale();

  const response = await getSessions({ practitionerId });
  const sessions = response.success ? response.sessions || [] : [];
  const isAdmin = response.success ? (response as any).isAdmin === true : false;

  // Practitioner list for admin filter
  let practitioners: { id: string; users: { name: string } | null }[] = [];
  if (isAdmin) {
    const pRes = await getAllPractitionersForFilter();
    if (pRes.success && pRes.practitioners) {
      practitioners = pRes.practitioners as unknown as typeof practitioners;
    }
  }

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
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/sessions/new`}>
            <Plus className="h-4 w-4 mr-2" />
            {t('newSession')}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('upcomingSessions')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="w-full text-2xl font-bold text-center">
              {sessions.filter(s => s.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pendingRequests')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="w-full text-2xl font-bold text-center">
              {sessions.filter(s => s.status === 'requested').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('completed')}</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="w-full text-2xl font-bold text-center">
              {sessions.filter(s => s.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              {/* Optional: using translations for card title/description if added, otherwise blank or basic */}
              <CardTitle>{t('title')}</CardTitle>
            </div>

            {isAdmin && practitioners.length > 0 && (
              <div className="flex items-center gap-2">
                <FacilitatorFilter
                  practitioners={practitioners}
                  currentValue={practitionerId}
                  basePath={`/${locale}/dashboard/sessions`}
                />
                {practitionerId && (
                  <Link
                    href={`/${locale}/dashboard/sessions`}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    {tFeedback('clear')}
                  </Link>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">{t('noSessions')}</p>
                {!isAdmin && <Button asChild className="mt-4">
                  <Link href={`/${locale}/dashboard/sessions/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('scheduleOne')}
                  </Link>
                </Button>}
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">{tFeedback('colClient')}</th>
                    {isAdmin && <th className="px-4 py-3 font-medium">{tFeedback('colFacilitator')}</th>}
                    <th className="px-4 py-3 font-medium">{tFeedback('colSessionDate')}</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Feedback</th>
                    <th className="px-4 py-3 font-medium text-right">{tFeedback('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <Link href={`/${locale}/dashboard/clients/${session.contacts?.id}`} className="font-medium hover:underline text-primary">
                          {session.contacts?.first_name} {session.contacts?.last_name}
                        </Link>
                      </td>

                      {isAdmin && (
                        <td className="px-4 py-4">
                          <Link href={`/${locale}/dashboard/practitioners/${session.practitioner_id}`} className="hover:underline text-primary">
                            {session.practitioners?.users?.name ?? '—'}
                          </Link>
                        </td>
                      )}

                      <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(session.scheduled_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </div>
                        <div className="flex items-center gap-1 text-xs mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(session.scheduled_at).toLocaleTimeString(undefined, { timeStyle: 'short' })} ({session.duration_minutes} min)
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <Badge variant={getStatusBadgeVariant(session.status)} className="capitalize px-2 py-0 border-primary/20">
                          {session.status.replace('_', ' ')}
                        </Badge>
                      </td>

                      <td className="px-4 py-4">
                        {session.session_feedback && (Array.isArray(session.session_feedback) ? session.session_feedback.length > 0 : Object.keys(session.session_feedback).length > 0) ? (
                          <Button asChild size="sm" variant="secondary" className="border-success text-success hover:bg-success/10 h-8">
                            <Link href={`/${locale}/dashboard/feedback/${Array.isArray(session.session_feedback) ? session.session_feedback[0].id : session.session_feedback.id}`}>
                              <MessageSquareCheck className="h-3.5 w-3.5 mr-2" />
                              {t('feedbackProvided')}
                            </Link>
                          </Button>
                        ) : session.status === 'completed' ? (
                          <FeedbackLinkButton sessionId={session.id} locale={locale}>
                            <MessageSquareDashed className="h-3.5 w-3.5 mr-2" />
                            {t('pendingFeedback')}
                          </FeedbackLinkButton>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/${locale}/dashboard/sessions/${session.id}`}
                          className="inline-block px-3 py-1.5 border rounded text-xs font-medium hover:bg-muted"
                        >
                          {t('viewDetails')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

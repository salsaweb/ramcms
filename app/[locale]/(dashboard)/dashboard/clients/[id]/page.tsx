import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getClientById } from '@/app/actions/clients';
import { ClientForm } from '@/components/clients/client-form';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle2, MessageSquareCheck, MessageSquareDashed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FeedbackLinkButton } from '@/components/feedback/feedback-link-button';
import { getSessions } from '@/app/actions/sessions';
import { getTranslations, getLocale } from 'next-intl/server';

interface ClientProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientProfilePage({ params }: ClientProfilePageProps) {
  const { id } = await params;
  await requirePermissionPage(PERMISSIONS.DASHBOARD_ACCESS);

  const [client, sessionsResponse] = await Promise.all([
    getClientById(id),
    getSessions({ clientId: id })
  ]);

  if (!client) {
    notFound();
  }

  const locale = await getLocale();
  const t = await getTranslations('clients');
  const tSession = await getTranslations('sessions');

  const sessions = sessionsResponse.success ? sessionsResponse.sessions || [] : [];

  // Stats
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const upcomingSessions = sessions.filter(s => s.status === 'confirmed').length;
  const pendingRequests = sessions.filter(s => s.status === 'requested').length;

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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/dashboard/clients`}
            className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.first_name} {client.last_name}</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              {t('clientProfile')}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <div className="space-y-2 w-full">
          <TabsList className="inline-flex border-b pb-1">
            <TabsTrigger value="overview">{t('overviewAndSessions')}</TabsTrigger>
            <TabsTrigger value="edit">{t('editDetails')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 w-full">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('completedSessions')}</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedSessions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('upcomingSessions')}</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcomingSessions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('pendingRequests')}</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingRequests}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('sessionHistory')}</CardTitle>
                    <CardDescription>{t('sessionDescription')}</CardDescription>
                  </div>
                  <Button asChild>
                    <Link href={`/${locale}/dashboard/sessions/new`}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('newSession')}
                    </Link>
                  </Button>
                </div>

              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t('noSessionsRecorded')}</p>
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
                            <Badge variant={getStatusBadgeVariant(session.status)} className="capitalize px-2 py-0 border-primary/20">
                              {session.status.replace('_', ' ')}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(session.scheduled_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(session.scheduled_at).toLocaleTimeString(undefined, { timeStyle: 'short' })} ({session.duration_minutes} min)
                            </span>
                            {session.session_feedback && (Array.isArray(session.session_feedback) ? session.session_feedback.length > 0 : Object.keys(session.session_feedback).length > 0) ? (
                              <span className="flex items-center gap-1 text-green-600 font-medium">
                                <Button asChild size="sm" variant="secondary" className="border-success text-success hover:bg-success/10">
                                  <Link href={`/${locale}/dashboard/feedback/${Array.isArray(session.session_feedback) ? session.session_feedback[0].id : session.session_feedback.id}`}>
                                    <MessageSquareCheck className="h-3.5 w-3.5" />
                                    {tSession('feedbackProvided')}
                                  </Link>
                                </Button>
                              </span>
                            ) : session.status === 'completed' ? (
                              <span className="flex items-center gap-1 text-amber-600 font-medium">
                                <FeedbackLinkButton sessionId={session.id} locale={locale}>
                                  <MessageSquareDashed className="h-3.5 w-3.5" />
                                  {tSession('pendingFeedback')}
                                </FeedbackLinkButton>
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:justify-end shrink-0">
                          <Link
                            href={`/dashboard/sessions/${session.id}`}
                            className="text-sm border px-3 py-1.5 rounded-md hover:bg-muted"
                          >
                            {t('viewSession')}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edit" className="mt-4 w-full">
            <ClientForm initialData={client} isEdit={true} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

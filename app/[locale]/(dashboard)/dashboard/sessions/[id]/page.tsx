import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getSessionById } from '@/app/actions/sessions';
import { getClients } from '@/app/actions/clients';
import { SessionForm } from '@/components/sessions/session-form';
import { FeedbackLink } from '@/components/feedback/feedback-link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquareCheck } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export default async function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermissionPage(PERMISSIONS.SESSIONS_READ);

  // Unwrap Next.js 15 async params safely!
  const { id } = await params;
  const t = await getTranslations('sessions');

  const [sessionRes, clients] = await Promise.all([
    getSessionById(id),
    getClients()
  ]);

  if (!sessionRes.success || !sessionRes.session) {
    notFound();
  }

  const session = sessionRes.session;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('editTitle')}</h1>
        <p className="text-muted-foreground">
          {t('editDescription', { name: `${session.contacts?.first_name} ${session.contacts?.last_name}` })}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          <SessionForm initialData={session} clients={clients} isEdit={true} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-primary">{t('statusTracker')}</CardTitle>
            </CardHeader>
            <CardDescription className="px-6 pb-6">
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>{t('currentlyMarkedAsStart')} <strong>{session.status.toUpperCase()}</strong>{t('currentlyMarkedAsEnd')}</p>
                <p>{t('statusNotes')}</p>
              </div>
            </CardDescription>
          </Card>

          {session.session_feedback && (Array.isArray(session.session_feedback) ? session.session_feedback.length > 0 : Object.keys(session.session_feedback).length > 0) ? (
            <Card className="border border-success/30 bg-success/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success text-lg">
                  <MessageSquareCheck className="h-5 w-5" />
                  {t('feedbackSubmittedTitle')}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t('feedbackSubmittedDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" variant="secondary" className="border-success text-success hover:bg-success/10">
                  <Link href={`/dashboard/feedback/${Array.isArray(session.session_feedback) ? session.session_feedback[0].id : session.session_feedback.id}`}>
                    {t('readFeedbackBtn')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <FeedbackLink sessionId={session.id} />
          )}
        </div>
      </div>
    </div>
  );
}

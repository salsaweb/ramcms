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

export default async function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermissionPage(PERMISSIONS.SESSIONS_READ);
  
  // Unwrap Next.js 15 async params safely!
  const { id } = await params;

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
        <h1 className="text-3xl font-bold tracking-tight">Edit Session</h1>
        <p className="text-muted-foreground">
          Manage session details and schedule for {session.contacts?.first_name} {session.contacts?.last_name}.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          <SessionForm initialData={session} clients={clients} isEdit={true} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-primary">Status Tracker</CardTitle>
            </CardHeader>
            <CardDescription className="px-6 pb-6">
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>Currently marked as <strong>{session.status.toUpperCase()}</strong>.</p>
                <p>If you mark this session as 'Completed', it will lock scheduling edits but allow you to update your internal notes.</p>
              </div>
            </CardDescription>
          </Card>

          {session.session_feedback && (Array.isArray(session.session_feedback) ? session.session_feedback.length > 0 : Object.keys(session.session_feedback).length > 0) ? (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <MessageSquareCheck className="h-5 w-5" />
                  Feedback Submitted
                </CardTitle>
                <CardDescription className="text-green-600/80">
                  Your client has provided feedback for this completed session.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <Button asChild size="sm" variant="outline" className="border-green-600 text-green-700 hover:bg-green-100">
                    <Link href={`/dashboard/feedback/${Array.isArray(session.session_feedback) ? session.session_feedback[0].id : session.session_feedback.id}`}>
                      Read Feedback
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

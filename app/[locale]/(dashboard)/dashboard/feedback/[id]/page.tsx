import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getFeedbackById } from '@/app/actions/feedback';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, ChevronLeft, User } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermissionPage(PERMISSIONS.FEEDBACK_READ);
  const { id } = await params;

  const result = await getFeedbackById(id);
  if (!result.success || !result.feedback) {
    notFound();
  }

  const feedback = result.feedback as any;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/feedback"
          className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback Report</h1>
          <p className="text-muted-foreground mt-1">
            Detailed feedback submitted by client
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50 border-b pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <Link href={`/dashboard/clients/${feedback.client_id}`} className="hover:underline">
                  {feedback.contacts?.first_name} {feedback.contacts?.last_name}
                </Link>
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Session Date: <Link href={`/dashboard/sessions/${feedback.session_id}`} className="text-primary hover:underline">{feedback.sessions?.scheduled_at ? new Date(feedback.sessions.scheduled_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Unknown'}</Link>
                <span className="mx-2">•</span>
                Submitted on {new Date(feedback.created_at).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 items-start md:items-end">
              {feedback.interested_in_learning && (
                <span className="inline-flex items-center rounded-md bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-sm font-medium text-purple-700 dark:text-purple-300 ring-1 ring-inset ring-purple-700/20 dark:ring-purple-400/20">
                  Interested in Learning Janzu
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">

          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">How did you feel in the arms of your facilitator?</h4>
            <p className="text-base bg-muted/30 p-4 rounded-lg leading-relaxed text-foreground">
              "{feedback.feeling_in_arms}"
            </p>
          </div>

          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overall experience</h4>
            <p className="text-base bg-muted/30 p-4 rounded-lg leading-relaxed text-foreground">
              "{feedback.overall_experience}"
            </p>
          </div>

          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Did you feel supported at the end of the session?</h4>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-base font-semibold text-foreground border-b pb-2 mb-2">{feedback.felt_supported}</p>
              {feedback.felt_supported_details ? (
                <p className="text-base text-foreground/80">
                  {feedback.felt_supported_details}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No additional details provided.</p>
              )}
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Additional Comments</h4>
            <p className="text-base bg-muted/30 p-4 rounded-lg leading-relaxed text-foreground">
              "{feedback.additional_comments}"
            </p>
          </div>

          <div className="space-y-3 md:col-span-2 pt-6 border-t">
            <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
              <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Intentions</h4>
              <div className="flex items-center gap-3">
                {feedback.continue_process.includes('another session') ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                )}
                <span className="text-lg font-medium text-foreground">
                  {feedback.continue_process}
                </span>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getPractitionerFeedback } from '@/app/actions/feedback';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquareQuote, CheckCircle2, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default async function FeedbackDashboardPage() {
  await requirePermissionPage(PERMISSIONS.FEEDBACK_READ);
  const response = await getPractitionerFeedback();
  const feedbackList = response.success ? response.feedback || [] : [];

  const completed = feedbackList.length;
  // Calculate how many wanted another session
  const retention = feedbackList.filter(f => f.continue_process.includes('another session')).length;
  const retentionRate = completed > 0 ? Math.round((retention / completed) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Feedback</h1>
          <p className="text-muted-foreground mt-1">
            Review thoughts and experiences shared by your clients.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Received</CardTitle>
            <MessageSquareQuote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention (Wanted Another Session)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retentionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>Recent Responses</CardTitle>
           <CardDescription>A summary list of all received feedback.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {feedbackList.length === 0 ? (
               <div className="text-center py-12 text-muted-foreground">
                 <p className="text-lg font-medium">No feedback received yet.</p>
                 <p className="text-sm mt-1">When you complete a session, send your client the feedback link provided in the session details.</p>
               </div>
            ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Client</th>
                      <th className="px-4 py-3 font-medium">Session Date</th>
                      <th className="px-4 py-3 font-medium">Submitted</th>
                      <th className="px-4 py-3 font-medium text-center">Continue?</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbackList.map((feedback) => {
                       const f = feedback as any;
                       const wantsAnother = f.continue_process.includes('another session');
                       
                       return (
                        <tr key={f.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-4">
                             <Link href={`/dashboard/clients/${f.client_id}`} className="font-medium hover:underline text-primary">
                                {f.contacts?.first_name} {f.contacts?.last_name}
                             </Link>
                          </td>
                          <td className="px-4 py-4">
                             <Link href={`/dashboard/sessions/${f.session_id}`} className="hover:underline text-primary">
                                {f.sessions?.scheduled_at ? new Date(f.sessions.scheduled_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Unknown'}
                             </Link>
                          </td>
                          <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                             {new Date(f.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-4 py-4 text-center">
                             {wantsAnother ? (
                                <span title={f.continue_process} className="inline-flex items-center justify-center p-1 rounded-full bg-green-100 text-green-700">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                             ) : (
                                <span title={f.continue_process} className="inline-flex items-center justify-center p-1 rounded-full bg-slate-100 text-slate-500">
                                  <HelpCircle className="w-4 h-4" />
                                </span>
                             )}
                          </td>
                          <td className="px-4 py-4 text-right">
                             <Link href={`/dashboard/feedback/${f.id}`} className="inline-block px-3 py-1.5 border rounded text-xs font-medium hover:bg-muted">
                                View Full
                             </Link>
                          </td>
                        </tr>
                       )
                    })}
                  </tbody>
                </table>
            )}
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}

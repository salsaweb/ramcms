import { getSessionForFeedback } from '@/app/actions/feedback';
import { FeedbackForm } from '@/components/feedback/feedback-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { notFound } from 'next/navigation';

export default async function FeedbackPage({ params }: { params: Promise<{ sessionId: string }> }) {
  // Await the params to unpack them in Next.js 15
  const { sessionId } = await params;

  // Validate the sessionId format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    notFound();
  }

  const result = await getSessionForFeedback(sessionId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Janzu Feedback</h1>
          <p className="text-lg text-slate-600">
            Share your experience to help us improve.
          </p>
        </div>

        <Card className="shadow-lg border-0">
          {!result.success ? (
             <CardContent className="pt-6">
                <div className="text-center py-12">
                   <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                     <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                   <h3 className="text-lg font-medium text-slate-900">Unable to load feedback form</h3>
                   <p className="mt-2 text-slate-500 max-w-sm mx-auto">{result.error}</p>
                </div>
             </CardContent>
          ) : (
            <>
              <CardHeader className="bg-slate-50/50 border-b pb-6">
                <CardTitle>Session Details</CardTitle>
                <CardDescription className="text-base mt-2">
                  Session provided by <strong>{(result.session as any)?.practitioners?.users?.name || 'your practitioner'}</strong> for{' '}
                  <strong>{(result.session as any)?.contacts?.first_name} {(result.session as any)?.contacts?.last_name}</strong>.
                </CardDescription>
                <CardDescription>
                  Please answer truthly. Your feedback is sent directly to your practitioner.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <FeedbackForm sessionId={sessionId} />
              </CardContent>
            </>
          )}
        </Card>
        
        <div className="text-center text-sm text-slate-500">
          <p>Powered by the Janzu Community Portal</p>
        </div>
      </div>
    </div>
  );
}

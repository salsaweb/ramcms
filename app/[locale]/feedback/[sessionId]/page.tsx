import { getSessionForFeedback } from '@/app/actions/feedback';
import { FeedbackForm } from '@/components/feedback/feedback-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import { Water } from '@paper-design/shaders-react';

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
    <div className="min-h-screen flex flex-col py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 z-[-1]">
        <Water
          style={{ height: "100%", width: "100%" }}
          image="https://paper.design/flowers.webp"
          colorBack="#8f8f8f"
          colorHighlight="#ffffff"
          highlights={0.07}
          layering={0.5}
          edges={0.8}
          waves={0.3}
          caustic={0.1}
          size={0.2}
          speed={0.25}
          scale={1.36}
          fit="cover"
        />
      </div>
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
                  <svg className="h-6 w-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground">Unable to load feedback form</h3>
                <p className="mt-2 text-muted-foreground max-w-sm mx-auto">{result.error}</p>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="bg-muted/50 border-b pb-6">
                <CardTitle>Session Details</CardTitle>

                <CardDescription className="text-base mt-2 text-muted-foreground">
                  Session provided by{" "}
                  <strong className="text-foreground">
                    {(result.session as any)?.practitioners?.users?.name || "your practitioner"}
                  </strong>.
                </CardDescription>

                <CardDescription className="text-muted-foreground">
                  Please answer truthfully. Your feedback is sent directly to your practitioner.
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

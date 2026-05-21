'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export function FeedbackLink({ sessionId }: { sessionId: string }) {
  const [copied, setCopied] = useState(false);
  const [feedbackUrl, setFeedbackUrl] = useState('');
  const t = useTranslations('feedback');
  const tError = useTranslations('error');
  const locale = useLocale();

  useEffect(() => {
    // Generate full URL on the client to get the correct origin
    setFeedbackUrl(`${window.location.origin}/${locale}/feedback/${sessionId}`);
  }, [sessionId]);

  const handleCopy = async () => {
    if (!feedbackUrl) return;
    try {
      await navigator.clipboard.writeText(feedbackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(tError('failedToCopyText'), err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-primary flex items-center gap-2">
          {t('feedbackLink')}
        </CardTitle>
        <CardDescription>
          {t('feedbackLinkDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mt-2">
          <code className="text-xs bg-muted p-2 rounded flex-1 overflow-x-auto whitespace-nowrap border">
            {feedbackUrl || 'Loading URL...'}
          </code>
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={!feedbackUrl}>
            {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

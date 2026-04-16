'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export function FeedbackLinkButton({
    sessionId,
    locale,
    children
}: {
    sessionId: string,
    locale: string,
    children: React.ReactNode
}) {
    const [copied, setCopied] = useState(false);
    const [feedbackUrl, setFeedbackUrl] = useState('');

    useEffect(() => {
        // Generate full URL on the client to get the correct origin
        setFeedbackUrl(`${window.location.origin}/${locale}/feedback/${sessionId}`);
    }, [sessionId, locale]);

    const handleCopy = async () => {
        if (!feedbackUrl) return;
        try {
            await navigator.clipboard.writeText(feedbackUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <Button variant="outline" size="sm" onClick={handleCopy} disabled={!feedbackUrl}>
            {copied ? (
                <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-green-600">Copied</span>
                </>
            ) : (
                children
            )}
        </Button>
    );
}

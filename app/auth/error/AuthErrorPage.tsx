'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, { title: string; description: string }> = {
    forbidden: {
      title: 'Access Denied',
      description: 'You do not have permission to access this resource.',
    },
    unauthorized: {
      title: 'Unauthorized',
      description: 'Please sign in to continue.',
    },
    default: {
      title: 'Authentication Error',
      description: 'An error occurred during authentication.',
    },
  };

  const errorInfo = errorMessages[error || 'default'] || errorMessages.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>There was a problem with your request</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>{errorInfo.title}</AlertTitle>
            <AlertDescription>{errorInfo.description}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button className="w-full">
            <Link href="/auth/login">Back to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
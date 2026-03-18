'use client';

import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle, AlertTriangle, Info } from 'lucide-react';

export function DashboardError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');
  const permission = searchParams.get('permission');

  if (!error) return null;

  const errorConfig = {
    forbidden: {
      icon: XCircle,
      variant: 'destructive' as const,
      title: 'Access Denied',
      description: permission 
        ? `You don't have the required permission: ${permission}`
        : 'You don\'t have permission to access this page.',
      actions: [
        'Contact your administrator to request access',
        'Check if you\'re logged in with the correct account',
        'Return to the dashboard home page'
      ]
    },
    unauthorized: {
      icon: AlertTriangle,
      variant: 'destructive' as const,
      title: 'Authentication Required',
      description: 'You need to be logged in to access this page.',
      actions: [
        'Please log in with your credentials',
        'If you were logged in, your session may have expired'
      ]
    },
    error: {
      icon: Info,
      variant: 'destructive' as const,
      title: 'An Error Occurred',
      description: message || 'Something went wrong. Please try again.',
      actions: [
        'Refresh the page',
        'If the problem persists, contact support'
      ]
    }
  };

  const config = errorConfig[error as keyof typeof errorConfig] || errorConfig.error;
  const Icon = config.icon;

  return (
    <Alert variant={config.variant} className="mb-6">
      <Icon className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold">{config.title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{config.description}</p>
        <div className="space-y-1 text-sm">
          <p className="font-medium">What you can do:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            {config.actions.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
        {permission && (
          <div className="mt-3 p-3 bg-gray-900 text-gray-100 rounded font-mono text-xs">
            Missing permission: <span className="text-red-400">{permission}</span>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
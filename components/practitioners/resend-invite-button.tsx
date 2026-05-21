'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { resendPractitionerInvite } from '@/app/actions/practitioners';

export function ResendInviteButton({ practitionerId }: { practitionerId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleResend() {
    setLoading(true);
    setMessage('');
    setError('');

    const result = await resendPractitionerInvite(practitionerId);
    
    if (result.success) {
      setMessage(result.message || 'Invite sent successfully');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setError(result.error || 'Failed to resend invite');
      setTimeout(() => setError(''), 3000);
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleResend} 
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Resend Invite'}
      </Button>
      {message && <span className="text-sm text-green-600 font-medium">{message}</span>}
      {error && <span className="text-sm text-red-600 font-medium">{error}</span>}
    </div>
  );
}

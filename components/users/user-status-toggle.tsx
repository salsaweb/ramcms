'use client';

import { useState } from 'react';
import { updateUserStatus } from '@/app/actions/user-management';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserStatusToggleProps {
  userId: string;
  isActive: boolean;
}

export function UserStatusToggle({ userId, isActive }: UserStatusToggleProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setLoading(true);
    setError(null);

    const result = await updateUserStatus(userId, !isActive);

    if (!result.success) {
      setError(result.error || 'Failed to update status');
      setLoading(false);
    }
    // If successful, page will revalidate
  };

  return (
    <div className="space-y-2">
      <Button
        variant={isActive ? 'destructive' : 'default'}
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? 'Updating...' : isActive ? 'Deactivate User' : 'Activate User'}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
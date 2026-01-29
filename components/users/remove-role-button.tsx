'use client';

import { useState } from 'react';
import { removeRoleFromUser } from '@/app/actions/user-management';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RemoveRoleButtonProps {
  userId: string;
  roleId: number;
  roleName: string;
}

export function RemoveRoleButton({ userId, roleId, roleName }: RemoveRoleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRemove = async () => {
    setLoading(true);
    setError(null);

    const result = await removeRoleFromUser({
      userId,
      roleId,
    });

    if (!result.success) {
      setError(result.error || 'Failed to remove role');
      setLoading(false);
      setShowConfirm(false);
    }
    // If successful, page will revalidate and component will unmount
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Remove {roleName}?</span>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleRemove}
          disabled={loading}
        >
          {loading ? 'Removing...' : 'Confirm'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowConfirm(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowConfirm(true)}
      >
        Remove
      </Button>
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
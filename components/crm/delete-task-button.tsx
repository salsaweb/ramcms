'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTask } from '@/app/actions/crm/tasks';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DeleteTaskButtonProps {
  taskId: string;
  taskTitle: string;
}

export function DeleteTaskButton({ taskId, taskTitle }: DeleteTaskButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    const result = await deleteTask(taskId);

    if (result.success) {
      router.push('/dashboard/crm/tasks');
    } else {
      setError(result.error || 'Failed to delete task');
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Delete this task?</span>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Confirm'}
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
        variant="destructive"
        onClick={() => setShowConfirm(true)}
      >
        Delete
      </Button>
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
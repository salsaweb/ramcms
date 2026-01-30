'use client';

import { useState } from 'react';
import { completeTask, updateTask } from '@/app/actions/crm/tasks';
import { Button } from '@/components/ui/button';

interface TaskStatusToggleProps {
  taskId: string;
  currentStatus: string;
}

export function TaskStatusToggle({ taskId, currentStatus }: TaskStatusToggleProps) {
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    await completeTask(taskId);
    setLoading(false);
  };

  const handleReopen = async () => {
    setLoading(true);
    await updateTask({ id: taskId, status: 'pending' });
    setLoading(false);
  };

  if (currentStatus === 'completed') {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleReopen}
        disabled={loading}
      >
        {loading ? 'Reopening...' : 'Reopen'}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      onClick={handleComplete}
      disabled={loading}
    >
      {loading ? 'Completing...' : 'Complete'}
    </Button>
  );
}
'use client';

import { useState } from 'react';
import { assignRoleToUser } from '@/app/actions/user-management';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AssignRoleFormProps {
  userId: string;
  availableRoles: Array<{
    id: number;
    name: string;
    description: string | null;
    permissionCount: number;
  }>;
}

export function AssignRoleForm({ userId, availableRoles }: AssignRoleFormProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoleId) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await assignRoleToUser({
      userId,
      roleId: selectedRoleId,
    });

    if (result.success) {
      setSuccess(true);
      setSelectedRoleId(null);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'Failed to assign role');
    }

    setLoading(false);
  };

  if (availableRoles.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        All available roles have been assigned to this user.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
          Assign New Role
        </label>
        <select
          id="role"
          value={selectedRoleId || ''}
          onChange={(e) => setSelectedRoleId(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        >
          <option value="">Select a role...</option>
          {availableRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name} ({role.permissionCount} permissions)
            </option>
          ))}
        </select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <AlertDescription>Role assigned successfully!</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={loading || !selectedRoleId}>
        {loading ? 'Assigning...' : 'Assign Role'}
      </Button>
    </form>
  );
}
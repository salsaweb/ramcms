'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cloneCustomRole, deleteCustomRole } from '@/app/actions/rbac/custom-roles';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RoleActionsProps {
  role: {
    id: number;
    name: string;
    is_system: boolean;
    user_count?: number;
  };
}

export function RoleActions({ role }: RoleActionsProps) {
  const router = useRouter();
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cloneName, setCloneName] = useState(`${role.name} (Copy)`);
  const [cloneDescription, setCloneDescription] = useState('');

  const handleClone = async () => {
    setLoading(true);
    setError(null);

    const result = await cloneCustomRole({
      sourceRoleId: role.id,
      newName: cloneName,
      newDescription: cloneDescription,
    });

    if (result.success) {
      router.push(`/dashboard/roles/${result.roleId}`);
    } else {
      setError(result.error || 'Failed to clone role');
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    const result = await deleteCustomRole(role.id);

    if (result.success) {
      router.push('/dashboard/roles');
    } else {
      setError(result.error || 'Failed to delete role');
    }

    setLoading(false);
  };

  return (
    <div className="flex gap-2">
      {/* Clone Button */}
      <Button variant="outline" onClick={() => setShowCloneModal(true)}>
        Clone Role
      </Button>

      {/* Delete Button (only for custom roles) */}
      {!role.is_system && (
        <Button
          variant="outline"
          onClick={() => setShowDeleteModal(true)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Delete Role
        </Button>
      )}

      {/* Clone Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Clone Role</h3>
            <p className="text-gray-600 mb-4">
              Create a copy of "{role.name}" with the same permissions
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Role Name *
                </label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Sales Manager (Copy)"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={cloneDescription}
                  onChange={(e) => setCloneDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Optional description"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCloneModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleClone}
                disabled={!cloneName.trim() || loading}
              >
                {loading ? 'Cloning...' : 'Clone Role'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ Delete Role</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>"{role.name}"</strong>?
            </p>

            {role.user_count && role.user_count > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  This role is assigned to {role.user_count} user(s). They will be left without a role.
                  Consider reassigning them first.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Deleting...' : 'Delete Role'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
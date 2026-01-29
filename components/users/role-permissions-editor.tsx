'use client';

import { useState } from 'react';
import { updateRolePermissions } from '@/app/actions/user-management';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Permission {
  id: number;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

interface RolePermissionsEditorProps {
  roleId: number;
  currentPermissions: Permission[];
  allPermissions: Permission[];
  groupedPermissions: Record<string, Permission[]>;
}

export function RolePermissionsEditor({
  roleId,
  currentPermissions,
  allPermissions,
  groupedPermissions,
}: RolePermissionsEditorProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(
    new Set(currentPermissions.map((p) => p.id))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleTogglePermission = (permissionId: number) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleToggleResource = (resource: string) => {
    const resourcePermissions = groupedPermissions[resource] || [];
    const allSelected = resourcePermissions.every((p) => selectedPermissions.has(p.id));
    
    const newSelected = new Set(selectedPermissions);
    resourcePermissions.forEach((perm) => {
      if (allSelected) {
        newSelected.delete(perm.id);
      } else {
        newSelected.add(perm.id);
      }
    });
    
    setSelectedPermissions(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await updateRolePermissions(roleId, Array.from(selectedPermissions));

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'Failed to update permissions');
    }

    setLoading(false);
  };

  const hasChanges = () => {
    const currentSet = new Set(currentPermissions.map((p) => p.id));
    if (currentSet.size !== selectedPermissions.size) return true;
    for (const id of currentSet) {
      if (!selectedPermissions.has(id)) return true;
    }
    return false;
  };

  const resources = Object.keys(groupedPermissions).sort();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quick Stats */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-sm text-gray-600">Selected Permissions</div>
          <div className="text-2xl font-bold">{selectedPermissions.size}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Total Available</div>
          <div className="text-2xl font-bold">{allPermissions.length}</div>
        </div>
      </div>

      {/* Permissions by Resource */}
      <div className="space-y-4">
        {resources.map((resource) => {
          const permissions = groupedPermissions[resource] || [];
          const selectedInResource = permissions.filter((p) => selectedPermissions.has(p.id)).length;
          const allSelected = selectedInResource === permissions.length;

          return (
            <div key={resource} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => handleToggleResource(resource)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900 capitalize">{resource}</h3>
                    <p className="text-xs text-gray-500">
                      {selectedInResource} of {permissions.length} selected
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {permissions.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-start gap-3 p-3 rounded border hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.has(perm.id)}
                      onChange={() => handleTogglePermission(perm.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">{perm.name}</div>
                      {perm.description && (
                        <div className="text-xs text-gray-500 mt-1">{perm.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <AlertDescription>Permissions updated successfully!</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={loading || !hasChanges()}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
        
        {hasChanges() && !loading && (
          <span className="text-sm text-orange-600">
            You have unsaved changes
          </span>
        )}
      </div>
    </form>
  );
}
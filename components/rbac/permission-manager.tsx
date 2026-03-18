'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateRolePermissions } from '@/app/actions/rbac/custom-roles';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PermissionManagerProps {
  roleId: number;
  roleName: string;
  isSystemRole: boolean;
  currentPermissionIds: number[];
  allPermissions: any[];
}

export function PermissionManager({
  roleId,
  roleName,
  isSystemRole,
  currentPermissionIds,
  allPermissions,
}: PermissionManagerProps) {
  const router = useRouter();
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>(currentPermissionIds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const hasChanges = JSON.stringify(selectedPermissions.sort()) !== JSON.stringify(currentPermissionIds.sort());

  const togglePermission = (permId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permId)
        ? prev.filter(id => id !== permId)
        : [...prev, permId]
    );
    setSuccess(false);
  };

  const toggleGroup = (group: any) => {
    const groupPermIds = group.permissions.map((p: any) => p.id);
    const allSelected = groupPermIds.every((id: number) => selectedPermissions.includes(id));

    if (allSelected) {
      // Deselect all
      setSelectedPermissions(prev => prev.filter(id => !groupPermIds.includes(id)));
    } else {
      // Select all
      setSelectedPermissions(prev => [...new Set([...prev, ...groupPermIds])]);
    }
    setSuccess(false);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await updateRolePermissions(roleId, selectedPermissions);

    if (result.success) {
      setSuccess(true);
      router.refresh();
    } else {
      setError(result.error || 'Failed to update permissions');
    }

    setLoading(false);
  };

  const handleReset = () => {
    setSelectedPermissions(currentPermissionIds);
    setSuccess(false);
    setError(null);
  };

  const filteredPermissions = allPermissions.map((group: any) => ({
    ...group,
    permissions: group.permissions.filter((perm: any) =>
      perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.description.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((group: any) => group.permissions.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Permissions</CardTitle>
        <CardDescription>
          {isSystemRole
            ? 'System role permissions can be modified but use caution'
            : 'Select permissions to grant to this role'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-2xl font-bold">{selectedPermissions.length}</div>
              <div className="text-sm text-gray-600">permissions selected</div>
            </div>
            {hasChanges && (
              <div className="text-sm text-orange-600 font-medium">
                ⚠️ Unsaved changes
              </div>
            )}
          </div>

          {/* Permission Groups */}
          <div className="space-y-4">
            {filteredPermissions.map((group: any) => {
              const groupPermIds = group.permissions.map((p: any) => p.id);
              const selectedCount = groupPermIds.filter((id: number) =>
                selectedPermissions.includes(id)
              ).length;
              const allSelected = selectedCount === groupPermIds.length;

              return (
                <div key={group.name} className="border rounded-lg overflow-hidden">
                  <div className="p-4 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => toggleGroup(group)}
                        className="rounded"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{group.icon}</span>
                        <span className="font-medium">{group.name}</span>
                        <span className="text-sm text-gray-600">
                          ({selectedCount}/{groupPermIds.length})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {group.permissions.map((perm: any) => (
                      <label
                        key={perm.id}
                        className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-1 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{perm.name}</span>
                            {perm.is_dangerous && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded">
                                Dangerous
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{perm.description}</div>
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
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                ✓ Permissions updated successfully
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || loading}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
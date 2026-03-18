'use client';

import { useState, useEffect } from 'react';
import { createCustomRole, createRoleFromTemplate, getAllPermissions } from '@/app/actions/rbac/custom-roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getJsonbArrayLength } from '@/lib/utils/jsonb';

interface CreateRoleModalProps {
  open: boolean;
  onClose: () => void;
  templates: any[];
  defaultTemplateId?: number;
  onSuccess: () => void;
}

export function CreateRoleModal({ open, onClose, templates, defaultTemplateId, onSuccess }: CreateRoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'scratch' | 'template'>('scratch');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(defaultTemplateId || null);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '🎭',
    permissionIds: [] as number[],
  });

  useEffect(() => {
    if (open && mode === 'scratch') {
      loadPermissions();
    }
  }, [open, mode]);

  useEffect(() => {
    if (defaultTemplateId) {
      setMode('template');
      setSelectedTemplateId(defaultTemplateId);
    }
  }, [defaultTemplateId]);

  const loadPermissions = async () => {
    const result = await getAllPermissions();
    if (result.success) {
      setAllPermissions(result.permissions || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;

      if (mode === 'template' && selectedTemplateId) {
        result = await createRoleFromTemplate(
          selectedTemplateId,
          formData.name,
          formData.description
        );
      } else {
        result = await createCustomRole(formData);
      }

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to create role');
      }
    } catch (err) {
      setError('Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId: number) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter(id => id !== permId)
        : [...prev.permissionIds, permId],
    }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Create New Role</h2>
          <p className="text-gray-600 mt-1">Define a custom role with specific permissions</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Creation Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMode('scratch')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    mode === 'scratch'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">From Scratch</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Choose individual permissions
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('template')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    mode === 'template'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">From Template</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Use pre-configured role
                  </div>
                </button>
              </div>
            </div>

            {/* Template Selection */}
            {mode === 'template' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template
                </label>
                <select
                  value={selectedTemplateId || ''}
                  onChange={(e) => setSelectedTemplateId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Choose a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {getJsonbArrayLength(template.template_permissions)} permissions
                    </option>
                  ))}
                </select>
                {selectedTemplateId && (
                  <p className="text-sm text-gray-600 mt-2">
                    {templates.find(t => t.id === selectedTemplateId)?.description}
                  </p>
                )}
              </div>
            )}

            {/* Basic Info */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Role Name *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sales Manager"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this role's purpose"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex gap-2">
                  <input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20"
                    disabled={loading}
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
                  Icon (emoji)
                </label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🎭"
                  maxLength={2}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Permissions Selection (only in scratch mode) */}
            {mode === 'scratch' && allPermissions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions ({formData.permissionIds.length} selected)
                </label>
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  {allPermissions.map((group: any) => (
                    <div key={group.name} className="border-b last:border-b-0">
                      <div className="p-3 bg-gray-50 font-medium text-sm flex items-center gap-2">
                        <span>{group.icon}</span>
                        <span>{group.name}</span>
                      </div>
                      <div className="p-3 space-y-2">
                        {group.permissions.map((perm: any) => (
                          <label
                            key={perm.id}
                            className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissionIds.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="mt-1"
                              disabled={loading}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{perm.name}</div>
                              <div className="text-xs text-gray-600">{perm.description}</div>
                              {perm.is_dangerous && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                  Dangerous
                                </span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
          >
            {loading ? 'Creating...' : 'Create Role'}
          </Button>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CustomField {
  id: number;
  field_name: string;
  field_label: string;
  field_type: string;
  field_group: string | null;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  field_options: any;
}

interface CustomFieldsListProps {
  fields: CustomField[];
}

export function CustomFieldsList({ fields }: CustomFieldsListProps) {
  const [localFields, setLocalFields] = useState(fields);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleToggleActive = async (fieldId: number, currentActive: boolean) => {
    setLoading(fieldId);
    setError(null);

    try {
      const response = await fetch('/api/crm/custom-fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: fieldId,
          isActive: !currentActive,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update field');
      }

      setLocalFields(prev =>
        prev.map(f => (f.id === fieldId ? { ...f, is_active: !currentActive } : f))
      );
      setSuccess('Field updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (fieldId: number) => {
    if (!confirm('Are you sure you want to delete this custom field? This action cannot be undone.')) {
      return;
    }

    setLoading(fieldId);
    setError(null);

    try {
      const response = await fetch(`/api/crm/custom-fields?id=${fieldId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete field');
      }

      setLocalFields(prev => prev.filter(f => f.id !== fieldId));
      setSuccess('Field deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const groupedFields = localFields.reduce((acc, field) => {
    const group = field.field_group || 'Ungrouped';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, CustomField[]>);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {localFields.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No custom fields yet. Create one above to get started.
        </div>
      ) : (
        Object.entries(groupedFields).map(([group, groupFields]) => (
          <div key={group} className="space-y-3">
            <h3 className="font-semibold text-gray-900">{group}</h3>
            <div className="space-y-2">
              {groupFields.map(field => (
                <div
                  key={field.id}
                  className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-900">{field.field_label}</h4>
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          {field.field_type}
                        </span>
                        {field.is_required && (
                          <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                            Required
                          </span>
                        )}
                        {!field.is_active && (
                          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Field name: <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                          {field.field_name}
                        </code>
                      </div>
                      {field.field_options && (
                        <div className="text-xs text-gray-500 mt-2">
                          Options: {Array.isArray(field.field_options) 
                            ? field.field_options.join(', ') 
                            : JSON.stringify(field.field_options)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(field.id, field.is_active)}
                        disabled={loading === field.id}
                      >
                        {field.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(field.id)}
                        disabled={loading === field.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
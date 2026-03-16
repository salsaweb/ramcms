'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CustomFieldBuilderProps {
  initialData?: any;
  onSuccess?: () => void;
}

export function CustomFieldBuilder({ initialData, onSuccess }: CustomFieldBuilderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fieldName: initialData?.field_name || '',
    fieldLabel: initialData?.field_label || '',
    fieldType: initialData?.field_type || 'text',
    fieldGroup: initialData?.field_group || '',
    helpText: initialData?.help_text || '',
    defaultValue: initialData?.default_value || '',
    isRequired: initialData?.is_required || false,
    isActive: initialData?.is_active !== false,
    displayOrder: initialData?.display_order || 0,
    options: initialData?.field_options ? JSON.stringify(initialData.field_options, null, 2) : '[]',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate field name (alphanumeric and underscores only)
      if (!/^[a-z0-9_]+$/.test(formData.fieldName)) {
        throw new Error('Field name must be lowercase alphanumeric with underscores only');
      }

      // Validate options for select/multi-select
      let parsedOptions = null;
      if (['select', 'multiselect'].includes(formData.fieldType)) {
        try {
          parsedOptions = JSON.parse(formData.options);
          if (!Array.isArray(parsedOptions)) {
            throw new Error('Options must be an array');
          }
        } catch (err) {
          throw new Error('Invalid JSON format for options');
        }
      }

      const response = await fetch('/api/crm/custom-fields', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: initialData?.id,
          fieldName: formData.fieldName,
          fieldLabel: formData.fieldLabel,
          fieldType: formData.fieldType,
          fieldGroup: formData.fieldGroup,
          helpText: formData.helpText,
          defaultValue: formData.defaultValue,
          isRequired: formData.isRequired,
          isActive: formData.isActive,
          displayOrder: parseInt(formData.displayOrder as any) || 0,
          fieldOptions: parsedOptions,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save custom field');
      }

      setSuccess(true);
      
      if (!initialData) {
        // Reset form for new field
        setFormData({
          fieldName: '',
          fieldLabel: '',
          fieldType: 'text',
          fieldGroup: '',
          helpText: '',
          defaultValue: '',
          isRequired: false,
          isActive: true,
          displayOrder: 0,
          options: '[]',
        });
      }

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1000);
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save custom field');
    } finally {
      setLoading(false);
    }
  };

  const needsOptions = ['select', 'multiselect'].includes(formData.fieldType);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fieldName" className="block text-sm font-medium text-gray-700 mb-1">
            Field Name * (database key)
          </label>
          <Input
            id="fieldName"
            name="fieldName"
            value={formData.fieldName}
            onChange={handleChange}
            placeholder="e.g., linkedin_url"
            required
            disabled={loading || !!initialData}
            pattern="[a-z0-9_]+"
            title="Lowercase letters, numbers, and underscores only"
          />
          <div className="text-xs text-gray-500 mt-1">
            Lowercase, numbers, underscores only. Cannot be changed after creation.
          </div>
        </div>

        <div>
          <label htmlFor="fieldLabel" className="block text-sm font-medium text-gray-700 mb-1">
            Field Label * (display name)
          </label>
          <Input
            id="fieldLabel"
            name="fieldLabel"
            value={formData.fieldLabel}
            onChange={handleChange}
            placeholder="e.g., LinkedIn URL"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="fieldType" className="block text-sm font-medium text-gray-700 mb-1">
            Field Type *
          </label>
          <select
            id="fieldType"
            name="fieldType"
            value={formData.fieldType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
          >
            <option value="text">Text</option>
            <option value="textarea">Textarea</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="boolean">Boolean (Checkbox)</option>
            <option value="select">Select (Dropdown)</option>
            <option value="multiselect">Multi-Select</option>
            <option value="file">File Upload</option>
          </select>
        </div>

        <div>
          <label htmlFor="fieldGroup" className="block text-sm font-medium text-gray-700 mb-1">
            Field Group (optional)
          </label>
          <Input
            id="fieldGroup"
            name="fieldGroup"
            value={formData.fieldGroup}
            onChange={handleChange}
            placeholder="e.g., Social Media"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-1">
            Display Order
          </label>
          <Input
            id="displayOrder"
            name="displayOrder"
            type="number"
            value={formData.displayOrder}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="defaultValue" className="block text-sm font-medium text-gray-700 mb-1">
            Default Value (optional)
          </label>
          <Input
            id="defaultValue"
            name="defaultValue"
            value={formData.defaultValue}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </div>

      {/* Help Text */}
      <div>
        <label htmlFor="helpText" className="block text-sm font-medium text-gray-700 mb-1">
          Help Text (optional)
        </label>
        <textarea
          id="helpText"
          name="helpText"
          value={formData.helpText}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Helpful description or instructions for this field"
          disabled={loading}
        />
      </div>

      {/* Options for Select/Multi-Select */}
      {needsOptions && (
        <div>
          <label htmlFor="options" className="block text-sm font-medium text-gray-700 mb-1">
            Options * (JSON array)
          </label>
          <textarea
            id="options"
            name="options"
            value={formData.options}
            onChange={handleChange}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            placeholder='["Option 1", "Option 2", "Option 3"]'
            required={needsOptions}
            disabled={loading}
          />
          <div className="text-xs text-gray-500 mt-1">
            Enter options as a JSON array. Example: ["Small", "Medium", "Large"]
          </div>
        </div>
      )}

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isRequired"
            checked={formData.isRequired}
            onChange={handleChange}
            disabled={loading}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium">Required Field</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            disabled={loading}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium">Active (visible to users)</span>
        </label>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <AlertDescription>
            Custom field {initialData ? 'updated' : 'created'} successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Field' : 'Create Field'}
        </Button>
      </div>
    </form>
  );
}
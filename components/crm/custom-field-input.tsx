'use client';

import { Input } from '@/components/ui/input';

interface CustomField {
  id: number;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options: any;
  is_required: boolean;
  help_text: string | null;
  default_value: string | null;
}

interface CustomFieldInputProps {
  field: CustomField;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export function CustomFieldInput({ field, value, onChange, disabled }: CustomFieldInputProps) {
  const fieldValue = value ?? field.default_value ?? '';

  // Text input
  if (field.field_type === 'text') {
    return (
      <div>
        <label htmlFor={field.field_name} className="block text-sm font-medium text-gray-700 mb-1">
          {field.field_label} {field.is_required && '*'}
        </label>
        <Input
          id={field.field_name}
          type="text"
          value={fieldValue}
          onChange={(e) => onChange(e.target.value)}
          required={field.is_required}
          disabled={disabled}
        />
        {field.help_text && (
          <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
        )}
      </div>
    );
  }

  // Textarea
  if (field.field_type === 'textarea') {
    return (
      <div className="md:col-span-2">
        <label htmlFor={field.field_name} className="block text-sm font-medium text-gray-700 mb-1">
          {field.field_label} {field.is_required && '*'}
        </label>
        <textarea
          id={field.field_name}
          value={fieldValue}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          required={field.is_required}
          disabled={disabled}
        />
        {field.help_text && (
          <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
        )}
      </div>
    );
  }

  // Number input
  if (field.field_type === 'number') {
    return (
      <div>
        <label htmlFor={field.field_name} className="block text-sm font-medium text-gray-700 mb-1">
          {field.field_label} {field.is_required && '*'}
        </label>
        <Input
          id={field.field_name}
          type="number"
          value={fieldValue}
          onChange={(e) => onChange(e.target.value)}
          required={field.is_required}
          disabled={disabled}
        />
        {field.help_text && (
          <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
        )}
      </div>
    );
  }

  // Date input
  if (field.field_type === 'date') {
    return (
      <div>
        <label htmlFor={field.field_name} className="block text-sm font-medium text-gray-700 mb-1">
          {field.field_label} {field.is_required && '*'}
        </label>
        <Input
          id={field.field_name}
          type="date"
          value={fieldValue}
          onChange={(e) => onChange(e.target.value)}
          required={field.is_required}
          disabled={disabled}
        />
        {field.help_text && (
          <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
        )}
      </div>
    );
  }

  // Boolean checkbox
  if (field.field_type === 'boolean') {
    return (
      <div className="flex items-start gap-2">
        <input
          id={field.field_name}
          type="checkbox"
          checked={fieldValue === true || fieldValue === 'true'}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="mt-1 rounded border-gray-300"
        />
        <div>
          <label htmlFor={field.field_name} className="text-sm font-medium text-gray-700">
            {field.field_label} {field.is_required && '*'}
          </label>
          {field.help_text && (
            <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
          )}
        </div>
      </div>
    );
  }

  // Select dropdown
  if (field.field_type === 'select') {
    const options = Array.isArray(field.field_options) ? field.field_options : [];
    return (
      <div>
        <label htmlFor={field.field_name} className="block text-sm font-medium text-gray-700 mb-1">
          {field.field_label} {field.is_required && '*'}
        </label>
        <select
          id={field.field_name}
          value={fieldValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          required={field.is_required}
          disabled={disabled}
        >
          <option value="">Select...</option>
          {options.map((option: string) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {field.help_text && (
          <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
        )}
      </div>
    );
  }

  // Multi-select
  if (field.field_type === 'multiselect') {
    const options = Array.isArray(field.field_options) ? field.field_options : [];
    const selectedValues = Array.isArray(fieldValue) ? fieldValue : [];

    const toggleOption = (option: string) => {
      if (selectedValues.includes(option)) {
        onChange(selectedValues.filter((v: string) => v !== option));
      } else {
        onChange([...selectedValues, option]);
      }
    };

    return (
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.field_label} {field.is_required && '*'}
        </label>
        <div className="space-y-2">
          {options.map((option: string) => (
            <label key={option} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={() => toggleOption(option)}
                disabled={disabled}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
        {field.help_text && (
          <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
        )}
        {selectedValues.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedValues.map((val: string) => (
              <span key={val} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                {val}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // File upload
  if (field.field_type === 'file') {
    return (
      <div className="md:col-span-2">
        <label htmlFor={field.field_name} className="block text-sm font-medium text-gray-700 mb-1">
          {field.field_label} {field.is_required && '*'}
        </label>
        <input
          id={field.field_name}
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // For now, just store filename
              // In production, you'd upload to cloud storage
              onChange(file.name);
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required={field.is_required}
          disabled={disabled}
        />
        {field.help_text && (
          <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
        )}
        {fieldValue && (
          <p className="text-sm text-gray-600 mt-1">Current file: {fieldValue}</p>
        )}
      </div>
    );
  }

  // Fallback for unknown types
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.field_label} {field.is_required && '*'}
      </label>
      <Input
        type="text"
        value={fieldValue}
        onChange={(e) => onChange(e.target.value)}
        required={field.is_required}
        disabled={disabled}
      />
      <p className="text-xs text-gray-500 mt-1">
        {field.help_text || `Unsupported field type: ${field.field_type}`}
      </p>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createContact, updateContact } from '@/app/actions/crm/contacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CustomFieldInput } from '@/components/crm/custom-field-input';

interface Company {
  id: string;
  name: string;
}

interface CustomField {
  id: number;
  field_name: string;
  field_label: string;
  field_type: string;
  field_group: string | null;
  field_options: any;
  is_required: boolean;
  help_text: string | null;
  default_value: string | null;
}

interface ContactFormData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  jobTitle: string;
  companyId: string;
  contactType: 'lead' | 'customer' | 'partner' | 'vendor';
  leadStatus: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'lost';
  city: string;
  state: string;
  country: string;
  tags: string[];
  customFields?: Record<string, any>;
}

interface ContactFormProps {
  companies: Company[];
  customFields?: CustomField[];
  initialData?: ContactFormData;
}

export function ContactForm({ companies, customFields = [], initialData }: ContactFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState<ContactFormData>(
    initialData || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      mobile: '',
      jobTitle: '',
      companyId: '',
      contactType: 'lead',
      leadStatus: 'new',
      city: '',
      state: '',
      country: '',
      tags: [],
      customFields: {},
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldName]: value,
      },
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = initialData?.id
      ? await updateContact({ id: initialData.id, ...formData })
      : await createContact(formData);

    if (result.success) {
      if (!initialData?.id && formData.id) {
        router.push(`/dashboard/crm/contacts/${formData.id}`);
      } else {
        router.push(`/dashboard/crm/contacts/${initialData?.id}`);
      }
    } else {
      setError(result.error || 'Failed to save contact');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
              Mobile
            </label>
            <Input
              id="mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Job Title
            </label>
            <Input
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Company & Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Company & Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <select
              id="companyId"
              name="companyId"
              value={formData.companyId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="">Select a company...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="contactType" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Type
            </label>
            <select
              id="contactType"
              name="contactType"
              value={formData.contactType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="lead">Lead</option>
              <option value="customer">Customer</option>
              <option value="partner">Partner</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
          <div>
            <label htmlFor="leadStatus" className="block text-sm font-medium text-gray-700 mb-1">
              Lead Status
            </label>
            <select
              id="leadStatus"
              name="leadStatus"
              value={formData.leadStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="unqualified">Unqualified</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State/Province
            </label>
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <Input
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Custom Fields */}
      {customFields && customFields.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Additional Information</h3>
          
          {/* Group custom fields */}
          {(() => {
            const grouped = customFields.reduce((acc, field) => {
              const group = field.field_group || 'Other';
              if (!acc[group]) acc[group] = [];
              acc[group].push(field);
              return acc;
            }, {} as Record<string, typeof customFields>);

            return Object.entries(grouped).map(([group, fields]) => (
              <div key={group} className="space-y-4">
                {Object.keys(grouped).length > 1 && (
                  <h4 className="font-medium text-gray-900">{group}</h4>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map((field) => (
                    <CustomFieldInput
                      key={field.id}
                      field={field}
                      value={formData.customFields?.[field.field_name]}
                      onChange={(value) => handleCustomFieldChange(field.field_name, value)}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* Tags */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Tags</h3>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add a tag..."
            disabled={loading}
          />
          <Button type="button" onClick={handleAddTag} disabled={loading}>
            Add Tag
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-blue-900 hover:text-blue-700"
                  disabled={loading}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData?.id ? 'Update Contact' : 'Create Contact'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
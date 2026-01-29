'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCompany, updateCompany } from '@/app/actions/crm/companies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CompanyFormData {
  id?: string;
  name: string;
  website: string;
  email: string;
  phone: string;
  companyType: 'prospect' | 'customer' | 'partner' | 'vendor' | 'competitor';
  industry: string;
  employeeCount: number | string;
  annualRevenue: number | string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  tags: string[];
}

interface CompanyFormProps {
  initialData?: CompanyFormData;
}

export function CompanyForm({ initialData }: CompanyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState<CompanyFormData>(
    initialData || {
      name: '',
      website: '',
      email: '',
      phone: '',
      companyType: 'prospect',
      industry: '',
      employeeCount: '',
      annualRevenue: '',
      addressLine1: '',
      city: '',
      state: '',
      country: '',
      tags: [],
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'employeeCount' | 'annualRevenue'
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? '' : parseFloat(value),
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
      ? await updateCompany({ id: initialData.id, ...formData })
      : await createCompany(formData);

    if (result.success) {
      if (!initialData?.id && result.company) {
        router.push(`/dashboard/crm/companies/${result.company.id}`);
      } else {
        router.push(`/dashboard/crm/companies/${initialData?.id}`);
      }
    } else {
      setError(result.error || 'Failed to save company');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="https://example.com"
              value={formData.website}
              onChange={handleChange}
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
            <label htmlFor="companyType" className="block text-sm font-medium text-gray-700 mb-1">
              Company Type
            </label>
            <select
              id="companyType"
              name="companyType"
              value={formData.companyType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="prospect">Prospect</option>
              <option value="customer">Customer</option>
              <option value="partner">Partner</option>
              <option value="vendor">Vendor</option>
              <option value="competitor">Competitor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Company Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <Input
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Employees
            </label>
            <Input
              id="employeeCount"
              name="employeeCount"
              type="number"
              min="1"
              value={formData.employeeCount}
              onChange={(e) => handleNumberChange(e, 'employeeCount')}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="annualRevenue" className="block text-sm font-medium text-gray-700 mb-1">
              Annual Revenue ($)
            </label>
            <Input
              id="annualRevenue"
              name="annualRevenue"
              type="number"
              min="0"
              step="0.01"
              value={formData.annualRevenue}
              onChange={(e) => handleNumberChange(e, 'annualRevenue')}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Address</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <Input
              id="addressLine1"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
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
      </div>

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
          {loading ? 'Saving...' : initialData?.id ? 'Update Company' : 'Create Company'}
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
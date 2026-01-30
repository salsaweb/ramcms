'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AdvancedContactFiltersProps {
  companies: Array<{ id: string; name: string }>;
}

export function AdvancedContactFilters({ companies }: AdvancedContactFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    contactType: searchParams.get('contactType') || '',
    leadStatus: searchParams.get('leadStatus') || '',
    companyId: searchParams.get('companyId') || '',
    minScore: searchParams.get('minScore') || '',
    maxScore: searchParams.get('maxScore') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    country: searchParams.get('country') || '',
    hasEmail: searchParams.get('hasEmail') || '',
    hasPhone: searchParams.get('hasPhone') || '',
    tags: searchParams.get('tags') || '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    router.push(`/dashboard/crm/contacts?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      contactType: '',
      leadStatus: '',
      companyId: '',
      minScore: '',
      maxScore: '',
      city: '',
      state: '',
      country: '',
      hasEmail: '',
      hasPhone: '',
      tags: '',
    });
    router.push('/dashboard/crm/contacts');
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </Button>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <Input
            id="search"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Name or email..."
          />
        </div>
        <div>
          <label htmlFor="contactType" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Type
          </label>
          <select
            id="contactType"
            name="contactType"
            value={filters.contactType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
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
            value={filters.leadStatus}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="unqualified">Unqualified</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <select
              id="companyId"
              name="companyId"
              value={filters.companyId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="minScore" className="block text-sm font-medium text-gray-700 mb-1">
              Min Lead Score
            </label>
            <Input
              id="minScore"
              name="minScore"
              type="number"
              min="0"
              max="100"
              value={filters.minScore}
              onChange={handleChange}
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="maxScore" className="block text-sm font-medium text-gray-700 mb-1">
              Max Lead Score
            </label>
            <Input
              id="maxScore"
              name="maxScore"
              type="number"
              min="0"
              max="100"
              value={filters.maxScore}
              onChange={handleChange}
              placeholder="100"
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <Input
              id="city"
              name="city"
              value={filters.city}
              onChange={handleChange}
              placeholder="Any city..."
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <Input
              id="state"
              name="state"
              value={filters.state}
              onChange={handleChange}
              placeholder="Any state..."
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <Input
              id="country"
              name="country"
              value={filters.country}
              onChange={handleChange}
              placeholder="Any country..."
            />
          </div>
          <div>
            <label htmlFor="hasEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Has Email
            </label>
            <select
              id="hasEmail"
              name="hasEmail"
              value={filters.hasEmail}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label htmlFor="hasPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Has Phone
            </label>
            <select
              id="hasPhone"
              name="hasPhone"
              value={filters.hasPhone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <Input
              id="tags"
              name="tags"
              value={filters.tags}
              onChange={handleChange}
              placeholder="vip, enterprise..."
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-4 border-t">
        <Button onClick={handleApplyFilters}>
          Apply Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={handleClearFilters}>
            Clear All
          </Button>
        )}
        {hasActiveFilters && (
          <span className="text-sm text-gray-600">
            {Object.values(filters).filter(v => v !== '').length} filter(s) active
          </span>
        )}
      </div>
    </div>
  );
}
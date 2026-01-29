'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDeal } from '@/app/actions/crm/deals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Company {
  id: string;
  name: string;
}

interface DealFormData {
  id?: string;
  name: string;
  description: string;
  amount: number | string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number | string;
  contactId: string;
  companyId: string;
  expectedCloseDate: string;
  tags: string[];
}

interface DealFormProps {
  contacts: Contact[];
  companies: Company[];
  initialData?: DealFormData;
}

export function DealForm({ contacts, companies, initialData }: DealFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState<DealFormData>(
    initialData || {
      name: '',
      description: '',
      amount: '',
      stage: 'prospecting',
      probability: 10,
      contactId: '',
      companyId: '',
      expectedCloseDate: '',
      tags: [],
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'amount' | 'probability'
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? '' : parseFloat(value),
    }));
  };

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stage = e.target.value as DealFormData['stage'];
    const stageProbabilities: Record<string, number> = {
      prospecting: 10,
      qualification: 25,
      proposal: 50,
      negotiation: 75,
      closed_won: 100,
      closed_lost: 0,
    };

    setFormData((prev) => ({
      ...prev,
      stage,
      probability: stageProbabilities[stage] || prev.probability,
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

    const result = await createDeal(formData);

    if (result.success) {
      if (result.deal) {
        router.push(`/dashboard/crm/deals/${result.deal.id}`);
      } else {
        router.push('/dashboard/crm/deals');
      }
    } else {
      setError(result.error || 'Failed to save deal');
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
              Deal Name *
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Enterprise License - Acme Corp"
              required
              disabled={loading}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Deal Amount ($) *
            </label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleNumberChange(e, 'amount')}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="expectedCloseDate" className="block text-sm font-medium text-gray-700 mb-1">
              Expected Close Date
            </label>
            <Input
              id="expectedCloseDate"
              name="expectedCloseDate"
              type="date"
              value={formData.expectedCloseDate}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Stage & Probability */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Stage & Probability</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
              Deal Stage *
            </label>
            <select
              id="stage"
              name="stage"
              value={formData.stage}
              onChange={handleStageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="prospecting">Prospecting (10%)</option>
              <option value="qualification">Qualification (25%)</option>
              <option value="proposal">Proposal (50%)</option>
              <option value="negotiation">Negotiation (75%)</option>
              <option value="closed_won">Closed Won (100%)</option>
              <option value="closed_lost">Closed Lost (0%)</option>
            </select>
          </div>
          <div>
            <label htmlFor="probability" className="block text-sm font-medium text-gray-700 mb-1">
              Win Probability (%)
            </label>
            <Input
              id="probability"
              name="probability"
              type="number"
              min="0"
              max="100"
              value={formData.probability}
              onChange={(e) => handleNumberChange(e, 'probability')}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Relationships */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact & Company</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactId" className="block text-sm font-medium text-gray-700 mb-1">
              Primary Contact
            </label>
            <select
              id="contactId"
              name="contactId"
              value={formData.contactId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="">Select a contact...</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name} - {contact.email}
                </option>
              ))}
            </select>
          </div>
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
          {loading ? 'Saving...' : initialData?.id ? 'Update Deal' : 'Create Deal'}
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
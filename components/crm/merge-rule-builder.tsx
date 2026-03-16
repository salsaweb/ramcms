'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function MergeRuleBuilder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    ruleName: '',
    description: '',
    minSimilarityScore: 95,
    requireEmail: true,
    requirePhone: false,
    requireName: false,
    autoMergeEnabled: false,
    masterSelectionRule: 'most_recent',
    notificationEnabled: true,
    isActive: false,
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
      const response = await fetch('/api/crm/merge-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleName: formData.ruleName,
          description: formData.description,
          minSimilarityScore: parseInt(formData.minSimilarityScore as any),
          requiredMatches: {
            email: formData.requireEmail,
            phone: formData.requirePhone,
            name: formData.requireName,
          },
          autoMergeEnabled: formData.autoMergeEnabled,
          masterSelectionRule: formData.masterSelectionRule,
          notificationEnabled: formData.notificationEnabled,
          isActive: formData.isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create merge rule');
      }

      setSuccess(true);
      
      // Reset form
      setFormData({
        ruleName: '',
        description: '',
        minSimilarityScore: 95,
        requireEmail: true,
        requirePhone: false,
        requireName: false,
        autoMergeEnabled: false,
        masterSelectionRule: 'most_recent',
        notificationEnabled: true,
        isActive: false,
      });

      setTimeout(() => {
        setSuccess(false);
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create merge rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="ruleName" className="block text-sm font-medium text-gray-700 mb-1">
            Rule Name *
          </label>
          <Input
            id="ruleName"
            name="ruleName"
            value={formData.ruleName}
            onChange={handleChange}
            placeholder="e.g., High Confidence Email Match"
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
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Describe when this rule should apply"
            disabled={loading}
          />
        </div>
      </div>

      {/* Similarity Score */}
      <div>
        <label htmlFor="minSimilarityScore" className="block text-sm font-medium text-gray-700 mb-1">
          Minimum Similarity Score: {formData.minSimilarityScore}%
        </label>
        <input
          type="range"
          id="minSimilarityScore"
          name="minSimilarityScore"
          min="50"
          max="100"
          value={formData.minSimilarityScore}
          onChange={handleChange}
          className="w-full"
          disabled={loading}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>50% (Low)</span>
          <span className={formData.minSimilarityScore >= 95 ? 'text-green-600 font-medium' : ''}>
            95% (Recommended)
          </span>
          <span>100% (Perfect)</span>
        </div>
      </div>

      {/* Required Matches */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Required Field Matches
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="requireEmail"
              checked={formData.requireEmail}
              onChange={handleChange}
              disabled={loading}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Require email match (recommended)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="requirePhone"
              checked={formData.requirePhone}
              onChange={handleChange}
              disabled={loading}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Require phone match</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="requireName"
              checked={formData.requireName}
              onChange={handleChange}
              disabled={loading}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Require name match</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Duplicates must match ALL selected fields to trigger this rule
        </p>
      </div>

      {/* Master Selection */}
      <div>
        <label htmlFor="masterSelectionRule" className="block text-sm font-medium text-gray-700 mb-1">
          Master Contact Selection
        </label>
        <select
          id="masterSelectionRule"
          name="masterSelectionRule"
          value={formData.masterSelectionRule}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        >
          <option value="most_recent">Most Recent (newer contact)</option>
          <option value="oldest">Oldest (older contact)</option>
          <option value="highest_score">Highest Lead Score</option>
          <option value="most_complete">Most Complete (more filled fields)</option>
          <option value="manual">Manual Selection Required</option>
        </select>
      </div>

      {/* Merge Behavior */}
      <div className="border-t pt-4">
        <h3 className="font-medium mb-3">Merge Behavior</h3>
        <div className="space-y-3">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="notificationEnabled"
              checked={formData.notificationEnabled}
              onChange={handleChange}
              disabled={loading}
              className="mt-0.5 rounded border-gray-300"
            />
            <div>
              <span className="text-sm font-medium">Enable Notifications</span>
              <p className="text-xs text-gray-500">
                Send email alerts when duplicates are detected or merged
              </p>
            </div>
          </label>

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="autoMergeEnabled"
              checked={formData.autoMergeEnabled}
              onChange={handleChange}
              disabled={loading}
              className="mt-0.5 rounded border-gray-300"
            />
            <div>
              <span className="text-sm font-medium text-orange-700">Enable Auto-Merge ⚠️</span>
              <p className="text-xs text-orange-600">
                Automatically merge contacts without manual review. Use with caution!
              </p>
            </div>
          </label>

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              disabled={loading}
              className="mt-0.5 rounded border-gray-300"
            />
            <div>
              <span className="text-sm font-medium">Activate Rule</span>
              <p className="text-xs text-gray-500">
                Start applying this rule to detect duplicates
              </p>
            </div>
          </label>
        </div>
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
            Merge rule created successfully! Page will reload...
          </AlertDescription>
        </Alert>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Rule'}
        </Button>
      </div>
    </form>
  );
}
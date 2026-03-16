'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MergeRule {
  id: number;
  rule_name: string;
  description: string | null;
  is_active: boolean;
  min_similarity_score: number;
  required_matches: any;
  auto_merge_enabled: boolean;
  master_selection_rule: string;
  notification_enabled: boolean;
  created_at: string;
}

interface MergeRulesListProps {
  rules: MergeRule[];
}

export function MergeRulesList({ rules }: MergeRulesListProps) {
  const [localRules, setLocalRules] = useState(rules);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleToggleActive = async (ruleId: number, currentActive: boolean) => {
    setLoading(ruleId);
    setError(null);

    try {
      const response = await fetch('/api/crm/merge-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ruleId,
          isActive: !currentActive,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update rule');
      }

      setLocalRules(prev =>
        prev.map(r => (r.id === ruleId ? { ...r, is_active: !currentActive } : r))
      );
      setSuccess('Rule updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleToggleAutoMerge = async (ruleId: number, currentEnabled: boolean) => {
    if (!currentEnabled && !confirm(
      '⚠️ WARNING: Enabling auto-merge will automatically combine contacts without manual review. ' +
      'Are you sure you want to enable this?'
    )) {
      return;
    }

    setLoading(ruleId);
    setError(null);

    try {
      const response = await fetch('/api/crm/merge-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ruleId,
          autoMergeEnabled: !currentEnabled,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update rule');
      }

      setLocalRules(prev =>
        prev.map(r => (r.id === ruleId ? { ...r, auto_merge_enabled: !currentEnabled } : r))
      );
      setSuccess('Auto-merge setting updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (ruleId: number) => {
    if (!confirm('Are you sure you want to delete this merge rule? This action cannot be undone.')) {
      return;
    }

    setLoading(ruleId);
    setError(null);

    try {
      const response = await fetch(`/api/crm/merge-rules?id=${ruleId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete rule');
      }

      setLocalRules(prev => prev.filter(r => r.id !== ruleId));
      setSuccess('Rule deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
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

      {localRules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No merge rules yet. Create one above to get started.
        </div>
      ) : (
        localRules.map(rule => {
          const requiredMatches = rule.required_matches || {};
          const matchesList = [];
          if (requiredMatches.email) matchesList.push('Email');
          if (requiredMatches.phone) matchesList.push('Phone');
          if (requiredMatches.name) matchesList.push('Name');

          return (
            <div
              key={rule.id}
              className={`p-4 border rounded-lg ${
                rule.is_active ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900">{rule.rule_name}</h4>
                    {rule.is_active ? (
                      <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                    {rule.auto_merge_enabled && (
                      <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">
                        Auto-Merge ON
                      </span>
                    )}
                  </div>
                  
                  {rule.description && (
                    <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <div className="text-gray-500">Min Similarity</div>
                      <div className="font-medium">{rule.min_similarity_score}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Required Matches</div>
                      <div className="font-medium">
                        {matchesList.length > 0 ? matchesList.join(', ') : 'None'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Master Selection</div>
                      <div className="font-medium capitalize">
                        {rule.master_selection_rule.replace('_', ' ')}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Notifications</div>
                      <div className="font-medium">
                        {rule.notification_enabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    Created: {new Date(rule.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(rule.id, rule.is_active)}
                    disabled={loading === rule.id}
                  >
                    {rule.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant={rule.auto_merge_enabled ? 'destructive' : 'outline'}
                    onClick={() => handleToggleAutoMerge(rule.id, rule.auto_merge_enabled)}
                    disabled={loading === rule.id}
                  >
                    {rule.auto_merge_enabled ? 'Disable Auto' : 'Enable Auto'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(rule.id)}
                    disabled={loading === rule.id}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
'use client';

import { useState } from 'react';
import { updateDealStage } from '@/app/actions/crm/deals';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DealStageUpdaterProps {
  dealId: string;
  currentStage: string;
}

export function DealStageUpdater({ dealId, currentStage }: DealStageUpdaterProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value as any;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await updateDealStage(dealId, newStage);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } else {
      setError(result.error || 'Failed to update stage');
    }

    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <select
        value={currentStage}
        onChange={handleStageChange}
        disabled={loading}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      >
        <option value="prospecting">Prospecting</option>
        <option value="qualification">Qualification</option>
        <option value="proposal">Proposal</option>
        <option value="negotiation">Negotiation</option>
        <option value="closed_won">Closed Won</option>
        <option value="closed_lost">Closed Lost</option>
      </select>
      
      {success && (
        <Alert variant="success">
          <AlertDescription>Stage updated successfully!</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
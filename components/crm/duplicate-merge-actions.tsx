'use client';

import { useState } from 'react';
import { mergeContacts, markDuplicateStatus } from '@/app/actions/crm/contact-advanced';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DuplicateMergeActionsProps {
  duplicateId: number;
  contact1Id: string;
  contact2Id: string;
  contact1Name: string;
  contact2Name: string;
}

export function DuplicateMergeActions({
  duplicateId,
  contact1Id,
  contact2Id,
  contact1Name,
  contact2Name,
}: DuplicateMergeActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);

  const handleMerge = async (masterId: string, mergeId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await mergeContacts({
      masterContactId: masterId,
      mergeContactId: mergeId,
      keepMasterData: [], // Will use intelligent merging
    });

    if (result.success) {
      setSuccess('Contacts merged successfully!');
      setTimeout(() => window.location.reload(), 2000);
    } else {
      setError(result.error || 'Failed to merge contacts');
    }

    setLoading(false);
  };

  const handleNotDuplicate = async () => {
    setLoading(true);
    setError(null);

    const result = await markDuplicateStatus(duplicateId, 'not_duplicate');

    if (result.success) {
      setSuccess('Marked as not duplicate');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      setError(result.error || 'Failed to update status');
    }

    setLoading(false);
  };

  const handleIgnore = async () => {
    setLoading(true);
    setError(null);

    const result = await markDuplicateStatus(duplicateId, 'ignored');

    if (result.success) {
      setSuccess('Duplicate ignored');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      setError(result.error || 'Failed to update status');
    }

    setLoading(false);
  };

  if (showMergeDialog) {
    return (
      <div className="mt-4 p-4 border-2 border-orange-300 rounded-lg bg-orange-50">
        <h4 className="font-semibold mb-3">Choose which contact to keep as master:</h4>
        <div className="space-y-2">
          <Button
            onClick={() => handleMerge(contact1Id, contact2Id)}
            disabled={loading}
            className="w-full"
          >
            Keep "{contact1Name}" as master
          </Button>
          <Button
            onClick={() => handleMerge(contact2Id, contact1Id)}
            disabled={loading}
            className="w-full"
          >
            Keep "{contact2Name}" as master
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowMergeDialog(false)}
            disabled={loading}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          The master contact will keep its data, and missing fields will be filled from the merged contact.
          All related records (deals, tasks, activities) will be moved to the master contact.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
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

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setShowMergeDialog(true)}
          disabled={loading}
        >
          Merge Contacts
        </Button>
        <Button
          variant="outline"
          onClick={handleNotDuplicate}
          disabled={loading}
        >
          Not a Duplicate
        </Button>
        <Button
          variant="ghost"
          onClick={handleIgnore}
          disabled={loading}
        >
          Ignore for Now
        </Button>
      </div>
    </div>
  );
}
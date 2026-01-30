'use client';

import { useState } from 'react';
import { transferContactOwnership } from '@/app/actions/crm/contact-advanced';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OwnershipTransferFormProps {
  contactId: string;
  currentOwnerId?: string;
  users: Array<{ id: string; name: string; email: string }>;
}

export function OwnershipTransferForm({
  contactId,
  currentOwnerId,
  users,
}: OwnershipTransferFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    toUserId: '',
    reason: '',
  });

  const availableUsers = users.filter((u) => u.id !== currentOwnerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await transferContactOwnership({
      contactId,
      toUserId: formData.toUserId,
      reason: formData.reason,
    });

    if (result.success) {
      setSuccess(true);
      setFormData({ toUserId: '', reason: '' });
      setShowForm(false);
      setTimeout(() => window.location.reload(), 2000);
    } else {
      setError(result.error || 'Failed to transfer ownership');
    }

    setLoading(false);
  };

  if (!showForm) {
    return (
      <div className="space-y-2">
        <Button onClick={() => setShowForm(true)} variant="outline" size="sm">
          Transfer Ownership
        </Button>
        {success && (
          <Alert variant="success">
            <AlertDescription>Ownership transferred successfully!</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-medium">Transfer Contact Ownership</h3>

      <div>
        <label htmlFor="toUserId" className="block text-sm font-medium text-gray-700 mb-1">
          Transfer To *
        </label>
        <select
          id="toUserId"
          value={formData.toUserId}
          onChange={(e) => setFormData((prev) => ({ ...prev, toUserId: e.target.value }))}
          className="w-full px-3 py-2 border rounded-md"
          required
          disabled={loading}
        >
          <option value="">Select user...</option>
          {availableUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} - {user.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
          Reason (optional)
        </label>
        <textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2 border rounded-md"
          disabled={loading}
          placeholder="Why are you transferring this contact?"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !formData.toUserId}>
          {loading ? 'Transferring...' : 'Transfer'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowForm(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
'use client';

import { useState } from 'react';
import { logCall } from '@/app/actions/crm/contact-advanced';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CallLogFormProps {
  contactId?: string;
  companyId?: string;
  dealId?: string;
  defaultPhone?: string;
}

export function CallLogForm({ contactId, companyId, dealId, defaultPhone }: CallLogFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    phoneNumber: defaultPhone || '',
    direction: 'outbound' as 'inbound' | 'outbound',
    outcome: 'answered' as 'answered' | 'voicemail' | 'no_answer' | 'busy' | 'failed',
    durationMinutes: '',
    durationSeconds: '',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const totalSeconds =
      (parseInt(formData.durationMinutes) || 0) * 60 +
      (parseInt(formData.durationSeconds) || 0);

    const result = await logCall({
      contactId,
      companyId,
      dealId,
      phoneNumber: formData.phoneNumber,
      direction: formData.direction,
      outcome: formData.outcome,
      durationSeconds: totalSeconds > 0 ? totalSeconds : undefined,
      notes: formData.notes,
    });

    if (result.success) {
      setSuccess(true);
      setFormData({
        phoneNumber: defaultPhone || '',
        direction: 'outbound',
        outcome: 'answered',
        durationMinutes: '',
        durationSeconds: '',
        notes: '',
      });
      setShowForm(false);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'Failed to log call');
    }

    setLoading(false);
  };

  if (!showForm) {
    return (
      <div className="space-y-2">
        <Button onClick={() => setShowForm(true)} size="sm">
          📞 Log Call
        </Button>
        {success && (
          <Alert variant="success">
            <AlertDescription>Call logged successfully!</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-medium">Log Phone Call</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-1">
            Direction
          </label>
          <select
            id="direction"
            name="direction"
            value={formData.direction}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
            disabled={loading}
          >
            <option value="outbound">Outbound (I called them)</option>
            <option value="inbound">Inbound (They called me)</option>
          </select>
        </div>

        <div>
          <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 mb-1">
            Outcome
          </label>
          <select
            id="outcome"
            name="outcome"
            value={formData.outcome}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
            disabled={loading}
          >
            <option value="answered">Answered</option>
            <option value="voicemail">Voicemail</option>
            <option value="no_answer">No Answer</option>
            <option value="busy">Busy</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Call Duration (optional)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            name="durationMinutes"
            type="number"
            min="0"
            placeholder="Minutes"
            value={formData.durationMinutes}
            onChange={handleChange}
            disabled={loading}
          />
          <Input
            name="durationSeconds"
            type="number"
            min="0"
            max="59"
            placeholder="Seconds"
            value={formData.durationSeconds}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
          disabled={loading}
          placeholder="What was discussed..."
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Logging...' : 'Log Call'}
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
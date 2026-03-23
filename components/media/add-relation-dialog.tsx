'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { importTrackFromSpotify, addTrackRelation } from '@/app/actions/media/tracks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, CheckCircle2 } from 'lucide-react';

interface AddRelationDialogProps {
  trackId: string;
  userId: string;
  direction: 'next' | 'previous';
}

export function AddRelationDialog({ trackId, userId, direction }: AddRelationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a Spotify URL');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Import or get existing track
      const importResult = await importTrackFromSpotify(url, userId);

      if (!importResult.success || !importResult.track) {
        setError(importResult.error || 'Failed to import track');
        setLoading(false);
        return;
      }

      // 2. Add relation
      const relationResult = await addTrackRelation(
        direction === 'next' ? trackId : importResult.track.id,
        direction === 'next' ? importResult.track.id : trackId,
        notes.trim() || null,
        userId
      );

      if (relationResult.success) {
        setSuccess(true);
        setUrl('');
        setNotes('');
        
        // Refresh page
        router.refresh();

        // Auto-close after 1.5 seconds
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 1500);
      } else {
        setError(relationResult.error || 'Failed to add relation');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setUrl('');
      setNotes('');
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Track
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {direction === 'next' ? 'Add Next Track' : 'Add Previous Track'}
          </DialogTitle>
          <DialogDescription>
            Paste a Spotify track URL to add a {direction === 'next' ? 'transition to' : 'lead-in from'} this track
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spotify-url">Spotify Track URL</Label>
            <Input
              id="spotify-url"
              placeholder="https://open.spotify.com/track/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Transition Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., 'Smooth mix at 2:30' or 'Energy boost for peak time'"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Transition added successfully!
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !url.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Adding...' : 'Add Transition'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
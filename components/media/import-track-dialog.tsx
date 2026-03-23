'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { importTrackFromSpotify } from '@/app/actions/media/tracks';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Music, CheckCircle2 } from 'lucide-react';

interface ImportTrackDialogProps {
  userId: string;
  onSuccess?: (track: any) => void;
}

export function ImportTrackDialog({ userId, onSuccess }: ImportTrackDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a Spotify URL');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await importTrackFromSpotify(url, userId);

      if (result.success) {
        setSuccess(result);
        setUrl('');
        
        if (onSuccess && result.track) {
          onSuccess(result.track);
        }

        // Refresh the page to show new track
        router.refresh();

        // Auto-close after 2 seconds
        setTimeout(() => {
          setOpen(false);
          setSuccess(null);
        }, 2000);
      } else {
        setError(result.error || 'Failed to import track');
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
      // Reset state when closing
      setUrl('');
      setError(null);
      setSuccess(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Music className="mr-2 h-4 w-4" />
          Import from Spotify
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Import Track from Spotify</DialogTitle>
          <DialogDescription>
            Paste a Spotify track URL to import it with full metadata
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
            <p className="text-xs text-muted-foreground">
              Example: https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                {success.isNew ? (
                  <>
                    <strong>{success.track.name}</strong> by{' '}
                    <strong>{success.artist?.name}</strong> imported successfully!
                  </>
                ) : (
                  <>
                    Track already exists in your library
                  </>
                )}
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
              {loading ? 'Importing...' : 'Import Track'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
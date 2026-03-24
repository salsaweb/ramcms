'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTracks } from '@/app/actions/media/tracks';
import { addTrackToPlaylist } from '@/app/actions/media/playlists';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Music, Loader2, Plus } from 'lucide-react';
import { formatDuration } from '@/lib/spotify/client';
import { useToast } from '@/hooks/use-toast';

interface AddTracksDialogProps {
  playlistId: string;
  userId: string;
  children: React.ReactNode;
}

export function AddTracksDialog({ playlistId, userId, children }: AddTracksDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);

  // Load tracks when dialog opens
  useEffect(() => {
    if (open) {
      loadTracks();
    }
  }, [open]);

  // Search tracks
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        loadTracks();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search, open]);

  const loadTracks = async () => {
    setLoading(true);
    const result = await getTracks({
      search: search || undefined,
      limit: 50,
    });

    if (result.success && result.tracks) {
      setTracks(result.tracks);
    }
    setLoading(false);
  };

  const handleAddTrack = async (trackId: string) => {
    setAddingTrackId(trackId);
    
    const result = await addTrackToPlaylist(playlistId, trackId, userId);

    if (result.success) {
      toast({
        title: 'Added',
        description: 'Track added to playlist',
      });
      router.refresh();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to add track',
        variant: 'destructive',
      });
    }

    setAddingTrackId(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Tracks to Playlist</DialogTitle>
          <DialogDescription>
            Search and add tracks from your library
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tracks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Track List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {search ? 'No tracks found' : 'No tracks in library'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {tracks.map((track: any) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {/* Album Cover */}
                  {track.album?.image_url ? (
                    <img
                      src={track.album.image_url}
                      alt={track.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <Music className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.artist?.name}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {track.bpm && (
                      <Badge variant="secondary" className="font-mono text-xs">
                        {Math.round(track.bpm)} BPM
                      </Badge>
                    )}
                    {track.musical_key_name && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {track.musical_key_name}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(track.duration_ms)}
                    </span>
                  </div>

                  {/* Add Button */}
                  <Button
                    size="sm"
                    onClick={() => handleAddTrack(track.id)}
                    disabled={addingTrackId === track.id}
                  >
                    {addingTrackId === track.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="mr-1 h-4 w-4" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTrackItem } from './sortable-track-item';
import { AddTracksDialog } from './add-tracks-dialog';
import { reorderPlaylistTracks, removeTrackFromPlaylist } from '@/app/actions/media/playlists';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlaylistEditorProps {
  playlist: {
    id: string;
    name: string;
    playlist_tracks?: Array<{
      id: string;
      position: number;
      track: {
        id: string;
        name: string;
        duration_ms: number;
        bpm?: number;
        musical_key_name?: string;
        preview_url?: string;
        spotify_url?: string;
        artist?: { id: string; name: string };
        album?: { id: string; name: string; image_url?: string };
      };
    }>;
  };
  userId: string;
}

export function PlaylistEditor({ playlist, userId }: PlaylistEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tracks, setTracks] = useState(playlist.playlist_tracks || []);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tracks.findIndex((t) => t.track.id === active.id);
      const newIndex = tracks.findIndex((t) => t.track.id === over.id);

      const newTracks = arrayMove(tracks, oldIndex, newIndex);
      
      // Update local state immediately for smooth UX
      setTracks(newTracks);

      // Save to database
      setSaving(true);
      const positions = newTracks.map((track, index) => ({
        trackId: track.track.id,
        position: index + 1,
      }));

      const result = await reorderPlaylistTracks(playlist.id, positions, userId);

      if (!result.success) {
        // Revert on error
        setTracks(tracks);
        toast({
          title: 'Error',
          description: result.error || 'Failed to save track order',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Saved',
          description: 'Track order updated',
        });
        router.refresh();
      }

      setSaving(false);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    setSaving(true);
    const result = await removeTrackFromPlaylist(playlist.id, trackId, userId);

    if (result.success) {
      setTracks(tracks.filter((t) => t.track.id !== trackId));
      toast({
        title: 'Removed',
        description: 'Track removed from playlist',
      });
      router.refresh();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to remove track',
        variant: 'destructive',
      });
    }

    setSaving(false);
  };

  if (tracks.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Music className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">No Tracks Yet</h2>
          <p className="text-muted-foreground">
            Add tracks to your playlist to start building your DJ set
          </p>
          <AddTracksDialog playlistId={playlist.id} userId={userId}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Tracks
            </Button>
          </AddTracksDialog>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Tracks Button */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Drag and drop to reorder tracks
        </p>
        <AddTracksDialog playlistId={playlist.id} userId={userId}>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Tracks
          </Button>
        </AddTracksDialog>
      </div>

      {/* Drag-and-Drop Track List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tracks.map((t) => t.track.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tracks.map((playlistTrack, index) => (
              <SortableTrackItem
                key={playlistTrack.track.id}
                track={playlistTrack.track}
                position={index + 1}
                onRemove={() => handleRemoveTrack(playlistTrack.track.id)}
                disabled={saving}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {saving && (
        <p className="text-sm text-muted-foreground text-center">
          Saving changes...
        </p>
      )}
    </div>
  );
}
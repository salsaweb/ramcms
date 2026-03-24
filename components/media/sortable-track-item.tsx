'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Music, Clock, X, ExternalLink } from 'lucide-react';
import { formatDuration } from '@/lib/spotify/client';
import Link from 'next/link';

interface SortableTrackItemProps {
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
  position: number;
  onRemove: () => void;
  disabled?: boolean;
}

export function SortableTrackItem({
  track,
  position,
  onRemove,
  disabled,
}: SortableTrackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={isDragging ? 'shadow-lg' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <button
            className="cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
            disabled={disabled}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Position */}
          <div className="w-8 text-center font-mono text-sm text-muted-foreground">
            {position}
          </div>

          {/* Album Cover */}
          <div className="flex-shrink-0">
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
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/dashboard/media/tracks/${track.id}`}
              className="font-medium hover:underline truncate block"
            >
              {track.name}
            </Link>
            <p className="text-sm text-muted-foreground truncate">
              {track.artist?.name}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {track.bpm && (
              <Badge variant="secondary" className="font-mono">
                {Math.round(track.bpm)} BPM
              </Badge>
            )}
            {track.musical_key_name && (
              <Badge variant="outline" className="font-mono">
                {track.musical_key_name}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(track.duration_ms)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {track.spotify_url && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-8 w-8"
              >
                <a
                  href={track.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              disabled={disabled}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
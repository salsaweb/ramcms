'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Clock, Zap } from 'lucide-react';
import { formatDuration } from '@/lib/spotify/client';

interface TrackCardProps {
  track: {
    id: string;
    name: string;
    duration_ms: number;
    bpm?: number;
    musical_key_name?: string;
    energy?: number;
    preview_url?: string;
    artist?: {
      name: string;
    };
    album?: {
      name: string;
      image_url?: string;
    };
  };
}

export function TrackCard({ track }: TrackCardProps) {
  return (
    <Link href={`/dashboard/media/tracks/${track.id}`}>
      <Card className="overflow-hidden hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Album Cover */}
            <div className="flex-shrink-0">
              {track.album?.image_url ? (
                <img
                  src={track.album.image_url}
                  alt={track.album.name}
                  className="w-16 h-16 rounded object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                  <Music className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{track.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {track.artist?.name}
              </p>
              {track.album?.name && (
                <p className="text-xs text-muted-foreground truncate">
                  {track.album.name}
                </p>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-col items-end gap-1 text-sm">
              {/* BPM & Key */}
              <div className="flex gap-2">
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
              </div>

              {/* Energy & Duration */}
              <div className="flex gap-3 text-xs text-muted-foreground">
                {track.energy !== undefined && (
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {Math.round(track.energy * 100)}%
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(track.duration_ms)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
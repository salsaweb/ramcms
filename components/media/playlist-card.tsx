'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Music } from 'lucide-react';

interface PlaylistCardProps {
  playlist: {
    id: string;
    name: string;
    description?: string;
    track_count?: any;
  };
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  // Extract track count
  const trackCount = Array.isArray(playlist.track_count) 
    ? playlist.track_count[0]?.count || 0
    : 0;

  return (
    <Link href={`/dashboard/media/playlists/${playlist.id}`}>
      <Card className="overflow-hidden hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-0">
          {/* Placeholder Cover - Will show first 4 track covers later */}
          <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Music className="h-16 w-16 text-muted-foreground" />
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold truncate">{playlist.name}</h3>
            {playlist.description && (
              <p className="text-sm text-muted-foreground truncate mt-1">
                {playlist.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
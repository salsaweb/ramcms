'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Music } from 'lucide-react';

interface ArtistCardProps {
  artist: {
    id: string;
    name: string;
    image_url?: string;
    track_count?: any;
  };
}

export function ArtistCard({ artist }: ArtistCardProps) {
  // Extract track count
  const trackCount = Array.isArray(artist.track_count) 
    ? artist.track_count[0]?.count || 0
    : 0;

  return (
    <Link href={`/dashboard/media/artists/${artist.id}`}>
      <Card className="overflow-hidden hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-0">
          {/* Artist Image */}
          <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5">
            {artist.image_url ? (
              <img
                src={artist.image_url}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold truncate">{artist.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
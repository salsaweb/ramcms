import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getArtistById } from '@/app/actions/media/artists';
import { notFound } from 'next/navigation';
import { TrackCard } from '@/components/media/track-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Music, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage(PERMISSIONS.TRACKS_READ);
  const { id } = await params;
  const result = await getArtistById(id);
  
  if (!result.success || !result.artist) {
    notFound();
  }

  const artist = result.artist;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/media/artists">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Artists
        </Button>
      </Link>

      {/* Artist Header */}
      <div className="flex gap-6">
        {/* Artist Image */}
        <div className="flex-shrink-0">
          {artist.image_url ? (
            <img
              src={artist.image_url}
              alt={artist.name}
              className="w-48 h-48 rounded-lg shadow-lg object-cover"
            />
          ) : (
            <div className="w-48 h-48 rounded-lg bg-muted flex items-center justify-center">
              <Music className="h-24 w-24 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Artist Info */}
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-4">{artist.name}</h1>
          
          {/* Genres */}
          {artist.genres && artist.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {artist.genres.map((genre: string) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-6 text-sm text-muted-foreground mb-4">
            {artist.followers && (
              <div>
                <span className="font-semibold text-foreground">
                  {artist.followers.toLocaleString()}
                </span>{' '}
                followers
              </div>
            )}
            {artist.popularity && (
              <div>
                Popularity:{' '}
                <span className="font-semibold text-foreground">
                  {artist.popularity}/100
                </span>
              </div>
            )}
            <div>
              <span className="font-semibold text-foreground">
                {artist.tracks?.length || 0}
              </span>{' '}
              tracks in library
            </div>
          </div>

          {/* Spotify Link */}
          {artist.spotify_url && (
            <Button variant="outline" asChild>
              <a href={artist.spotify_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in Spotify
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Tracks */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Tracks</h2>
        {artist.tracks && artist.tracks.length > 0 ? (
          <div className="grid gap-3">
            {artist.tracks.map((track: any) => (
              <TrackCard key={track.id} track={{ ...track, artist }} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No tracks found for this artist.
          </p>
        )}
      </div>
    </div>
  );
}
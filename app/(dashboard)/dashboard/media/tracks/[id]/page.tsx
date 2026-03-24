import { requirePermissionPage, getCurrentUser } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getTrackById } from '@/app/actions/media/tracks';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Music, Clock, Zap, Play, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { formatDuration } from '@/lib/spotify/client';
import { AddRelationDialog } from '@/components/media/add-relation-dialog';

export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage(PERMISSIONS.TRACKS_READ);
  const { id } = await params;
  const user = await getCurrentUser();
  const result = await getTrackById(id);
  
  if (!result.success || !result.track) {
    notFound();
  }

  const track = result.track;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/media/tracks">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tracks
        </Button>
      </Link>

      {/* Track Header */}
      <div className="flex gap-6">
        {/* Album Cover */}
        <div className="flex-shrink-0">
          {track.album?.image_url ? (
            <img
              src={track.album.image_url}
              alt={track.album.name}
              className="w-48 h-48 rounded-lg shadow-lg object-cover"
            />
          ) : (
            <div className="w-48 h-48 rounded-lg bg-muted flex items-center justify-center">
              <Music className="h-24 w-24 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">{track.name}</h1>
          <p className="text-xl text-muted-foreground mb-4">
            <Link
              href={`/dashboard/media/artists/${track.artist.id}`}
            >
              {track.artist?.name}
            </Link>
          </p>
          
          {track.album && (
            <p className="text-sm text-muted-foreground mb-4">
              Album: {track.album.name}
            </p>
          )}

          {/* Metadata Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {track.bpm && (
              <Badge variant="secondary" className="font-mono text-base px-3 py-1">
                {Math.round(track.bpm)} BPM
              </Badge>
            )}
            {track.musical_key_name && (
              <Badge variant="outline" className="font-mono text-base px-3 py-1">
                Key: {track.musical_key_name}
              </Badge>
            )}
            {track.energy !== undefined && (
              <Badge variant="outline" className="text-base px-3 py-1">
                <Zap className="mr-1 h-4 w-4" />
                Energy: {Math.round(track.energy * 100)}%
              </Badge>
            )}
            <Badge variant="outline" className="text-base px-3 py-1">
              <Clock className="mr-1 h-4 w-4" />
              {formatDuration(track.duration_ms)}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {track.preview_url && (
              <Button variant="default">
                <Play className="mr-2 h-4 w-4" />
                Preview
              </Button>
            )}
            {track.spotify_url && (
              <Button variant="outline" asChild>
                <a href={track.spotify_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Spotify
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Audio Features */}
      <Card>
        <CardHeader>
          <CardTitle>Audio Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {track.danceability !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Danceability</p>
                <p className="text-2xl font-bold">{Math.round(track.danceability * 100)}%</p>
              </div>
            )}
            {track.valence !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Positivity</p>
                <p className="text-2xl font-bold">{Math.round(track.valence * 100)}%</p>
              </div>
            )}
            {track.acousticness !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Acousticness</p>
                <p className="text-2xl font-bold">{Math.round(track.acousticness * 100)}%</p>
              </div>
            )}
            {track.instrumentalness !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Instrumental</p>
                <p className="text-2xl font-bold">{Math.round(track.instrumentalness * 100)}%</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DJ Transitions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* What Can Play Next */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>What Can Play Next</CardTitle>
            <AddRelationDialog trackId={track.id} userId={user.id} direction="next" />
          </CardHeader>
          <CardContent>
            {track.relations_to && track.relations_to.length > 0 ? (
              <div className="space-y-3">
                {track.relations_to.map((relation: any) => (
                  <Link
                    key={relation.id}
                    href={`/dashboard/media/tracks/${relation.to_track.id}`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex gap-3">
                      {relation.to_track.album?.image_url && (
                        <img
                          src={relation.to_track.album.image_url}
                          alt={relation.to_track.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{relation.to_track.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {relation.to_track.artist?.name}
                        </p>
                        {relation.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            💡 {relation.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        {relation.to_track.bpm && (
                          <Badge variant="secondary" className="font-mono">
                            {Math.round(relation.to_track.bpm)} BPM
                          </Badge>
                        )}
                        {relation.to_track.musical_key_name && (
                          <Badge variant="outline" className="font-mono mt-1">
                            {relation.to_track.musical_key_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No next tracks added yet. Add transitions to build your DJ flow!
              </p>
            )}
          </CardContent>
        </Card>

        {/* What Could Play Before */}
        <Card>
          <CardHeader>
            <CardTitle>What Could Play Before</CardTitle>
          </CardHeader>
          <CardContent>
            {track.relations_from && track.relations_from.length > 0 ? (
              <div className="space-y-3">
                {track.relations_from.map((relation: any) => (
                  <Link
                    key={relation.id}
                    href={`/dashboard/media/tracks/${relation.from_track.id}`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex gap-3">
                      {relation.from_track.album?.image_url && (
                        <img
                          src={relation.from_track.album.image_url}
                          alt={relation.from_track.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{relation.from_track.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {relation.from_track.artist?.name}
                        </p>
                        {relation.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            💡 {relation.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        {relation.from_track.bpm && (
                          <Badge variant="secondary" className="font-mono">
                            {Math.round(relation.from_track.bpm)} BPM
                          </Badge>
                        )}
                        {relation.from_track.musical_key_name && (
                          <Badge variant="outline" className="font-mono mt-1">
                            {relation.from_track.musical_key_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No previous tracks linked yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
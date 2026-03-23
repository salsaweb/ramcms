import { requirePermissionPage, getCurrentUser } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getTracks } from '@/app/actions/media/tracks';
import { getUserPlaylists } from '@/app/actions/media/playlists';
import { getArtists } from '@/app/actions/media/artists';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Users, ListMusic, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { ImportTrackDialog } from '@/components/media/import-track-dialog';

export default async function MediaPage() {
  await requirePermissionPage(PERMISSIONS.MEDIA_ACCESS);
  const user = await getCurrentUser();

  // Fetch stats
  const [tracksResult, playlistsResult, artistsResult] = await Promise.all([
    getTracks({ limit: 5 }),
    getUserPlaylists(user.id),
    getArtists({ limit: 10 }),
  ]);

  const totalTracks = tracksResult.success ? tracksResult.total : 0;
  const recentTracks = tracksResult.success ? tracksResult.tracks : [];
  const totalPlaylists = playlistsResult.success ? playlistsResult.playlists?.length : 0;
  const totalArtists = artistsResult.success ? artistsResult.total : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground mt-1">
            Your DJ music collection
          </p>
        </div>
        <ImportTrackDialog userId={user.id} />
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTracks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In your library
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Artists</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalArtists}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique artists
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Playlists</CardTitle>
            <ListMusic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlaylists}</div>
            <p className="text-xs text-muted-foreground mt-1">
              DJ sets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/dashboard/media/tracks">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-primary/10">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Browse Tracks</h3>
                <p className="text-sm text-muted-foreground">
                  View and filter your tracks
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/media/artists">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Browse Artists</h3>
                <p className="text-sm text-muted-foreground">
                  Explore by artist
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/media/playlists">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-primary/10">
                <ListMusic className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">My Playlists</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your sets
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Tracks */}
      {recentTracks && recentTracks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recently Added</CardTitle>
              <Link href="/dashboard/media/tracks">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTracks.slice(0, 5).map((track: any) => (
                <Link
                  key={track.id}
                  href={`/dashboard/media/tracks/${track.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
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
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.artist?.name}
                    </p>
                  </div>
                  {track.bpm && (
                    <div className="text-sm font-mono text-muted-foreground">
                      {Math.round(track.bpm)} BPM
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {totalTracks === 0 && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Start Building Your Library</h2>
            <p className="text-muted-foreground">
              Import your first track from Spotify to begin creating your DJ music collection
            </p>
            <ImportTrackDialog userId={user.id} />
          </div>
        </Card>
      )}
    </div>
  );
}
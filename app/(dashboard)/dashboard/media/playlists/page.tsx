import { requirePermissionPage, getCurrentUser } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getUserPlaylists } from '@/app/actions/media/playlists';
import { CreatePlaylistDialog } from '@/components/media/create-playlist-dialog';
import { PlaylistCard } from '@/components/media/playlist-card';

export default async function PlaylistsPage() {
  await requirePermissionPage(PERMISSIONS.PLAYLISTS_READ);
  const user = await getCurrentUser();

  const result = await getUserPlaylists(user.id);
  const playlists = result.success ? result.playlists ?? [] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Playlists</h1>
          <p className="text-muted-foreground mt-1">
            {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
          </p>
        </div>
        <CreatePlaylistDialog userId={user.id} />
      </div>

      {/* Playlists Grid */}
      {playlists && playlists.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist: any) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No playlists yet. Create your first playlist!
          </p>
          <CreatePlaylistDialog userId={user.id} />
        </div>
      )}
    </div>
  );
}
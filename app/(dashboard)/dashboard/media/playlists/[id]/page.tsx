import { requirePermissionPage, getCurrentUser } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getPlaylistById } from '@/app/actions/media/playlists';
import { notFound } from 'next/navigation';
import { PlaylistEditor } from '@/components/media/playlist-editor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage(PERMISSIONS.PLAYLISTS_READ);
  const user = await getCurrentUser();
  const { id } = await params;

  const result = await getPlaylistById(id, user.id);
  
  if (!result.success || !result.playlist) {
    notFound();
  }

  const playlist = result.playlist;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/media/playlists">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Playlists
        </Button>
      </Link>

      {/* Playlist Header */}
      <div>
        <h1 className="text-3xl font-bold">{playlist.name}</h1>
        {playlist.description && (
          <p className="text-muted-foreground mt-1">{playlist.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {playlist.playlist_tracks?.length || 0} tracks
        </p>
      </div>

      {/* Playlist Editor */}
      <PlaylistEditor playlist={playlist} userId={user.id} />
    </div>
  );
}
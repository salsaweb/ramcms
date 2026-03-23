import { requirePermissionPage, getCurrentUser } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getTracks } from '@/app/actions/media/tracks';
import { ImportTrackDialog } from '@/components/media/import-track-dialog';
import { TrackCard } from '@/components/media/track-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default async function TracksPage({
  searchParams,
}: {
  searchParams: { search?: string; bpmMin?: string; bpmMax?: string; key?: string };
}) {
  await requirePermissionPage(PERMISSIONS.TRACKS_READ);
  const user = await getCurrentUser();

  // Get filters from URL
  const filters = {
    search: searchParams.search,
    bpmMin: searchParams.bpmMin ? parseInt(searchParams.bpmMin) : undefined,
    bpmMax: searchParams.bpmMax ? parseInt(searchParams.bpmMax) : undefined,
    key: searchParams.key,
  };

  // Fetch tracks
  const result = await getTracks(filters);
  const tracks = result.success ? result.tracks : [];
  const total = result.success ? result.total : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tracks</h1>
          <p className="text-muted-foreground mt-1">
            {total} {total === 1 ? 'track' : 'tracks'} in your library
          </p>
        </div>
        <ImportTrackDialog userId={user.id} />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tracks..."
              defaultValue={searchParams.search}
              className="pl-9"
            />
          </div>
        </div>
        <Input
          type="number"
          placeholder="Min BPM"
          defaultValue={searchParams.bpmMin}
          className="w-24"
        />
        <Input
          type="number"
          placeholder="Max BPM"
          defaultValue={searchParams.bpmMax}
          className="w-24"
        />
        <Button variant="outline">Filter</Button>
      </div>

      {/* Tracks List */}
      {tracks && tracks.length > 0 ? (
        <div className="grid gap-3">
          {tracks.map((track: any) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No tracks found. Import your first track from Spotify!
          </p>
          <ImportTrackDialog userId={user.id} />
        </div>
      )}
    </div>
  );
}
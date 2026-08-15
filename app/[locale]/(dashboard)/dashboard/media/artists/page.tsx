import { requirePermissionPage } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getArtists } from '@/app/actions/media/artists';
import { ArtistCard } from '@/components/media/artist-card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  await requirePermissionPage(PERMISSIONS.TRACKS_READ);

  const result = await getArtists({
    search: searchParams.search,
  });

  const artists = result.success ? result.artists : [];
  const total = result.success ? result.total : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Artists</h1>
        <p className="text-muted-foreground mt-1">
          {total} {total === 1 ? 'artist' : 'artists'} in your library
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search artists..."
          defaultValue={searchParams.search}
          className="pl-9"
        />
      </div>

      {/* Artists Grid */}
      {artists && artists.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {artists.map((artist: any) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No artists found. Import tracks to see artists!
          </p>
        </div>
      )}
    </div>
  );
}
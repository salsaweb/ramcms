'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { 
  parseSpotifyUrl, 
  getSpotifyTrack, 
  getSpotifyAudioFeatures, 
  getSpotifyArtist, 
  getSpotifyAlbum,
  getMusicalKeyName 
} from '@/lib/spotify/client';

interface ImportResult {
  success: boolean;
  track?: any;
  artist?: any;
  album?: any;
  error?: string;
  isNew?: boolean;
}

/**
 * Import track from Spotify URL
 * Auto-creates artist and album if they don't exist
 */
export async function importTrackFromSpotify(
  spotifyUrl: string,
  userId: string
): Promise<ImportResult> {
  try {
    // 1. Parse Spotify URL
    const parsed = parseSpotifyUrl(spotifyUrl);
    
    if (!parsed || parsed.type !== 'track') {
      return { success: false, error: 'Invalid Spotify track URL' };
    }

    // 2. Check if track already exists
    const { data: existingTrack } = await supabaseAdmin
      .from('tracks')
      .select('*, artist:artists(*), album:albums(*)')
      .eq('spotify_id', parsed.id)
      .single();

    if (existingTrack) {
      return { 
        success: true, 
        track: existingTrack, 
        artist: existingTrack.artist,
        album: existingTrack.album,
        isNew: false 
      };
    }

    // 3. Fetch track data from Spotify
    const trackData = await getSpotifyTrack(parsed.id);
    const audioFeatures = await getSpotifyAudioFeatures(parsed.id);

    // 4. Get or create artist
    let artistId: string | null = null;
    if (trackData.artists && trackData.artists.length > 0) {
      const mainArtist = trackData.artists[0];
      artistId = await getOrCreateArtist(mainArtist.id);
    }

    // 5. Get or create album
    let albumId: string | null = null;
    if (trackData.album) {
      albumId = await getOrCreateAlbum(trackData.album.id);
    }

    // 6. Create track
    const { data: track, error: trackError } = await supabaseAdmin
      .from('tracks')
      .insert({
        spotify_id: trackData.id,
        name: trackData.name,
        artist_id: artistId,
        album_id: albumId,
        duration_ms: trackData.duration_ms,
        explicit: trackData.explicit,
        popularity: trackData.popularity,
        track_number: trackData.track_number,
        disc_number: trackData.disc_number,
        preview_url: trackData.preview_url,
        spotify_url: trackData.external_urls.spotify,
        isrc: trackData.external_ids?.isrc,
        
        // Audio features
        bpm: audioFeatures?.tempo,
        musical_key: audioFeatures?.key,
        musical_key_name: audioFeatures ? getMusicalKeyName(audioFeatures.key, audioFeatures.mode) : null,
        mode: audioFeatures?.mode,
        time_signature: audioFeatures?.time_signature,
        energy: audioFeatures?.energy,
        danceability: audioFeatures?.danceability,
        valence: audioFeatures?.valence,
        acousticness: audioFeatures?.acousticness,
        instrumentalness: audioFeatures?.instrumentalness,
        liveness: audioFeatures?.liveness,
        speechiness: audioFeatures?.speechiness,
        loudness: audioFeatures?.loudness,
        
        created_by: userId,
      })
      .select('*, artist:artists(*), album:albums(*)')
      .single();

    if (trackError) {
      console.error('Track creation error:', trackError);
      return { success: false, error: 'Failed to save track to database' };
    }

    return { 
      success: true, 
      track, 
      artist: track.artist,
      album: track.album,
      isNew: true 
    };

  } catch (error: any) {
    console.error('Import error:', error);
    return { success: false, error: error.message || 'Failed to import track' };
  }
}

/**
 * Get or create artist from Spotify
 */
async function getOrCreateArtist(spotifyArtistId: string): Promise<string | null> {
  try {
    // Check if exists
    const { data: existing } = await supabaseAdmin
      .from('artists')
      .select('id')
      .eq('spotify_id', spotifyArtistId)
      .single();

    if (existing) {
      return existing.id;
    }

    // Fetch from Spotify
    const artistData = await getSpotifyArtist(spotifyArtistId);

    // Create artist
    const { data: artist, error } = await supabaseAdmin
      .from('artists')
      .insert({
        spotify_id: artistData.id,
        name: artistData.name,
        image_url: artistData.images?.[0]?.url || null,
        genres: artistData.genres || [],
        popularity: artistData.popularity,
        followers: artistData.followers?.total,
        spotify_url: artistData.external_urls.spotify,
        external_urls: artistData.external_urls,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Artist creation error:', error);
      return null;
    }

    return artist.id;
  } catch (error) {
    console.error('Get or create artist error:', error);
    return null;
  }
}

/**
 * Get or create album from Spotify
 */
async function getOrCreateAlbum(spotifyAlbumId: string): Promise<string | null> {
  try {
    // Check if exists
    const { data: existing } = await supabaseAdmin
      .from('albums')
      .select('id')
      .eq('spotify_id', spotifyAlbumId)
      .single();

    if (existing) {
      return existing.id;
    }

    // Fetch from Spotify
    const albumData = await getSpotifyAlbum(spotifyAlbumId);

    // Create album
    const { data: album, error } = await supabaseAdmin
      .from('albums')
      .insert({
        spotify_id: albumData.id,
        name: albumData.name,
        album_type: albumData.album_type,
        release_date: albumData.release_date,
        release_date_precision: albumData.release_date_precision,
        total_tracks: albumData.total_tracks,
        image_url: albumData.images?.[0]?.url || null,
        images: albumData.images,
        spotify_url: albumData.external_urls.spotify,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Album creation error:', error);
      return null;
    }

    return album.id;
  } catch (error) {
    console.error('Get or create album error:', error);
    return null;
  }
}

/**
 * Get all tracks with filters
 */
export async function getTracks(filters?: {
  search?: string;
  bpmMin?: number;
  bpmMax?: number;
  key?: string;
  artistId?: number;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabaseAdmin
      .from('tracks')
      .select(`
        *,
        artist:artists(*),
        album:albums(*)
      `, { count: 'exact' });

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,artist.name.ilike.%${filters.search}%`);
    }

    if (filters?.bpmMin) {
      query = query.gte('bpm', filters.bpmMin);
    }

    if (filters?.bpmMax) {
      query = query.lte('bpm', filters.bpmMax);
    }

    if (filters?.key) {
      query = query.eq('musical_key_name', filters.key);
    }

    if (filters?.artistId) {
      query = query.eq('artist_id', filters.artistId);
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, tracks: data, total: count };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get track by ID with relations
 */
export async function getTrackById(trackId: string) {
  try {
    const { data: track, error } = await supabaseAdmin
      .from('tracks')
      .select(`
        *,
        artist:artists(*),
        album:albums(*),

        relations_to:track_relations!fk_track_relations_from_track(
          id,
          to_track_id,
          notes,
          created_at,
          to_track:tracks!fk_track_relations_to_track(
            id,
            name,
            bpm,
            musical_key_name,
            artist:artists(name),
            album:albums(image_url)
          )
        ),

        relations_from:track_relations!fk_track_relations_to_track(
          id,
          from_track_id,
          notes,
          created_at,
          from_track:tracks!fk_track_relations_from_track(
            id,
            name,
            bpm,
            musical_key_name,
            artist:artists(name),
            album:albums(image_url)
          )
        )
      `)
      .eq('id', trackId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, track };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Add track relation (for DJ transitions)
 */
export async function addTrackRelation(
  fromTrackId: string,
  toTrackId: string,
  notes: string | null,
  userId: string
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('track_relations')
      .insert({
        from_track_id: fromTrackId,
        to_track_id: toTrackId,
        notes,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, relation: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Remove track relation
 */
export async function removeTrackRelation(relationId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('track_relations')
      .delete()
      .eq('id', relationId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete track
 */
export async function deleteTrack(trackId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('tracks')
      .delete()
      .eq('id', trackId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
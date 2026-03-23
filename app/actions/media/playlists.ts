'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Get all playlists for a user
 */
export async function getUserPlaylists(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('playlists')
      .select(`
        *,
        track_count:playlist_tracks(count)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, playlists: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get playlist by ID with tracks
 */
export async function getPlaylistById(playlistId: string, userId: string) {
  try {
    const { data: playlist, error } = await supabaseAdmin
      .from('playlists')
      .select(`
        *,
        playlist_tracks(
          id,
          position,
          track:tracks(
            id,
            name,
            duration_ms,
            bpm,
            musical_key_name,
            energy,
            preview_url,
            spotify_url,
            artist:artists(id, name),
            album:albums(id, name, image_url)
          )
        )
      `)
      .eq('id', playlistId)
      .eq('created_by', userId) // Ensure user owns this playlist
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Sort tracks by position
    if (playlist.playlist_tracks) {
      playlist.playlist_tracks.sort((a: any, b: any) => a.position - b.position);
    }

    return { success: true, playlist };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create new playlist
 */
export async function createPlaylist(
  name: string,
  description: string | null,
  userId: string
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('playlists')
      .insert({
        name,
        description,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, playlist: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update playlist
 */
export async function updatePlaylist(
  playlistId: string,
  updates: { name?: string; description?: string | null },
  userId: string
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('playlists')
      .update(updates)
      .eq('id', playlistId)
      .eq('created_by', userId) // Ensure user owns this playlist
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, playlist: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete playlist
 */
export async function deletePlaylist(playlistId: string, userId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('playlists')
      .delete()
      .eq('id', playlistId)
      .eq('created_by', userId); // Ensure user owns this playlist

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Add track to playlist
 */
export async function addTrackToPlaylist(
  playlistId: string,
  trackId: string,
  userId: string
) {
  try {
    // Verify user owns playlist
    const { data: playlist } = await supabaseAdmin
      .from('playlists')
      .select('id')
      .eq('id', playlistId)
      .eq('created_by', userId)
      .single();

    if (!playlist) {
      return { success: false, error: 'Playlist not found or access denied' };
    }

    // Get next position
    const { data: tracks } = await supabaseAdmin
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = tracks && tracks.length > 0 ? tracks[0].position + 1 : 1;

    // Add track
    const { data, error } = await supabaseAdmin
      .from('playlist_tracks')
      .insert({
        playlist_id: playlistId,
        track_id: trackId,
        position: nextPosition,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return { success: false, error: 'Track already in playlist' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, playlistTrack: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Remove track from playlist
 */
export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string,
  userId: string
) {
  try {
    // Verify user owns playlist
    const { data: playlist } = await supabaseAdmin
      .from('playlists')
      .select('id')
      .eq('id', playlistId)
      .eq('created_by', userId)
      .single();

    if (!playlist) {
      return { success: false, error: 'Playlist not found or access denied' };
    }

    // Remove track
    const { error } = await supabaseAdmin
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Reorder remaining tracks
    await reorderPlaylistPositions(playlistId);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Reorder playlist tracks
 * positions is an array of { trackId, position } objects
 */
export async function reorderPlaylistTracks(
  playlistId: string,
  positions: { trackId: string; position: number }[],
  userId: string
) {
  try {
    // Verify user owns playlist
    const { data: playlist } = await supabaseAdmin
      .from('playlists')
      .select('id')
      .eq('id', playlistId)
      .eq('created_by', userId)
      .single();

    if (!playlist) {
      return { success: false, error: 'Playlist not found or access denied' };
    }

    // Update positions
    for (const { trackId, position } of positions) {
      await supabaseAdmin
        .from('playlist_tracks')
        .update({ position })
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Helper: Reorder positions after deletion
 */
async function reorderPlaylistPositions(playlistId: string) {
  const { data: tracks } = await supabaseAdmin
    .from('playlist_tracks')
    .select('track_id, position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  if (!tracks) return;

  // Update positions to be sequential
  for (let i = 0; i < tracks.length; i++) {
    await supabaseAdmin
      .from('playlist_tracks')
      .update({ position: i + 1 })
      .eq('playlist_id', playlistId)
      .eq('track_id', tracks[i].track_id);
  }
}

/**
 * Get playlist cover images (first 4 tracks)
 */
export async function getPlaylistCoverImages(playlistId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('playlist_tracks')
      .select(`
        track:tracks(
          album:albums(image_url)
        )
      `)
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true })
      .limit(4);

    if (error) {
      return { success: false, error: error.message };
    }

    const images = data
      .map((pt: any) => pt.track?.album?.image_url)
      .filter(Boolean)
      .slice(0, 4);

    return { success: true, images };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
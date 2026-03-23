'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Get all artists
 */
export async function getArtists(filters?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabaseAdmin
      .from('artists')
      .select(`
        *,
        track_count:tracks(count)
      `, { count: 'exact' });

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const { data, error, count } = await query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, artists: data, total: count };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get artist by ID with tracks
 */
export async function getArtistById(artistId: string) {
  try {
    const { data: artist, error } = await supabaseAdmin
      .from('artists')
      .select(`
        *,
        tracks(
          id,
          name,
          duration_ms,
          bpm,
          musical_key_name,
          energy,
          popularity,
          preview_url,
          spotify_url,
          album:albums(id, name, image_url)
        )
      `)
      .eq('id', artistId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, artist };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
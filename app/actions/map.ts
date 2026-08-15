'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export interface MapPin {
  id: string;
  type: 'practitioner' | 'location';
  latitude: number;
  longitude: number;
  
  // Specific data
  title: string;
  subtitle?: string; // Country/City
  category?: string; // e.g. location type
  imageUrl?: string;
  
  href: string; // The URL to visit when they click the pin
}

export async function getMapPins(): Promise<{ success: boolean; data?: MapPin[]; error?: string }> {
  try {
    const pins: MapPin[] = [];

    // 1. Fetch Practitioners with geo-coordinates
    const { data: practitioners, error: pErr } = await supabaseAdmin
      .from('practitioners')
      .select(`
        id,
        latitude,
        longitude,
        location_city,
        location_country,
        profile_picture_url,
        users!user_id (name)
      `)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (pErr) throw pErr;

    if (practitioners) {
      for (const p of practitioners) {
        pins.push({
          id: p.id,
          type: 'practitioner',
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
          title: (p.users as any)?.name || 'Practitioner',
          subtitle: p.location_city ? `${p.location_city}, ${p.location_country || ''}` : p.location_country,
          imageUrl: p.profile_picture_url,
          href: `/dashboard/practitioners/${p.id}`,
        });
      }
    }

    // 2. Fetch Locations that are approved and have exact coordinates
    const { data: locations, error: lErr } = await supabaseAdmin
      .from('locations')
      .select(`
        id,
        name,
        type,
        city,
        country,
        latitude,
        longitude,
        image_urls
      `)
      .eq('status', 'approved')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (lErr) throw lErr;

    if (locations) {
      for (const l of locations) {
        pins.push({
          id: l.id,
          type: 'location',
          latitude: Number(l.latitude),
          longitude: Number(l.longitude),
          title: l.name,
          subtitle: l.city ? `${l.city}, ${l.country || ''}` : l.country,
          category: l.type,
          imageUrl: l.image_urls && l.image_urls.length > 0 ? l.image_urls[0] : undefined,
          href: `/dashboard/locations/${l.id}`,
        });
      }
    }

    return { success: true, data: pins };

  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch map data.' };
  }
}

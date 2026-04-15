import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Fetch published events ensuring it has the locations mapped correctly
    const { data, error } = await supabaseAdmin
      .from('events')
      .select(`
        id,
        title,
        description,
        type,
        start_date,
        end_date,
        price_guide,
        image_url,
        max_attendees,
        address,
        locations (
           name,
           city,
           country,
           latitude,
           longitude
        )
      `)
      .eq('status', 'published')
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(limit);

    if (error) {
       console.error('Public API Error /events:', error);
       return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
    }

    const sanitizedPayload = data.map((ev: any) => ({
       id: ev.id,
       title: ev.title,
       description: ev.description,
       type: ev.type,
       start_date: ev.start_date,
       end_date: ev.end_date,
       price_guide: ev.price_guide,
       image_url: ev.image_url,
       max_attendees: ev.max_attendees,
       location_text: ev.address || ev.locations?.name || 'TBA',
       geo: ev.locations ? {
          lat: ev.locations.latitude,
          lng: ev.locations.longitude,
          city: ev.locations.city,
          country: ev.locations.country
       } : null
    }));

    return NextResponse.json({
        success: true,
        count: sanitizedPayload.length,
        data: sanitizedPayload
    }, { headers: corsHeaders });

  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 400, headers: corsHeaders });
  }
}

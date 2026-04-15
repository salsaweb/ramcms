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
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    
    const { data, error } = await supabaseAdmin
      .from('locations')
      .select(`
        id,
        name,
        description,
        type,
        address,
        city,
        country,
        latitude,
        longitude,
        water_temperature
      `)
      .eq('status', 'approved')
      .limit(limit);

    if (error) {
       console.error('Public API Error /locations:', error);
       return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
    }

    const sanitizedPayload = data.map((loc: any) => ({
       id: loc.id,
       name: loc.name,
       description: loc.description,
       type: loc.type,
       address: loc.address,
       city: loc.city,
       country: loc.country,
       water_temperature: loc.water_temperature,
       geo: {
          lat: loc.latitude,
          lng: loc.longitude
       }
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

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
    
    // Fetch active practitioners cleanly, omitting entirely the private `contacts` mapping data
    // We only join the `users` table to grab the First/Last Name and Profile picture.
    const { data, error } = await supabaseAdmin
      .from('practitioners')
      .select(`
        id,
        bio,
        specialties,
        languages,
        years_experience,
        city,
        country,
        latitude,
        longitude,
        users (
          name,
          profile_picture_url
        )
      `)
      .limit(limit);

    if (error) {
       console.error('Public API Error /practitioners:', error);
       return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
    }

    // Flatten logic securely: Only emit safe traits.
    const sanitizedPayload = data.map((pr: any) => ({
       id: pr.id,
       name: pr.users?.name || 'Anonymous Practitioner',
       avatar: pr.users?.profile_picture_url || null,
       bio: pr.bio,
       specialties: pr.specialties,
       languages: pr.languages,
       years_experience: pr.years_experience,
       location: {
         city: pr.city,
         country: pr.country,
         lat: pr.latitude,
         lng: pr.longitude
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

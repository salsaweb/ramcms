import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { 
  authenticateApiRequest, 
  hasPermission,
} from '@/lib/api/auth';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response';

const createPractitionerSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  bio: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  locationName: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApiRequest(request);
    
    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    if (!hasPermission(auth.permissions!, 'practitioners.read')) {
      return forbiddenResponse('You do not have permission to read practitioners');
    }

    const { data: practitioners, error } = await supabaseAdmin
      .from('practitioners')
      .select('*, users(id, name, email, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return successResponse(
      { practitioners },
      200
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApiRequest(request);
    
    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    if (!hasPermission(auth.permissions!, 'practitioners.create')) {
      return forbiddenResponse('You do not have permission to create practitioners');
    }

    const body = await request.json();
    const validatedData = createPractitionerSchema.parse(body);

    const { data: practitioner, error } = await supabaseAdmin
      .from('practitioners')
      .insert({
        user_id: validatedData.userId,
        bio: validatedData.bio,
        website: validatedData.website,
        location_name: validatedData.locationName,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return successResponse(
      { practitioner, message: 'Practitioner created successfully' },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error);
    }
    return serverErrorResponse(error);
  }
}

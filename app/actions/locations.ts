'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createLocationSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().optional(),
  type: z.enum(['pool', 'sea', 'cenote', 'river', 'lake', 'other']),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  waterTemperature: z.string().optional(),
  priceGuide: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional(),
});

const reviewLocationSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
  adminNotes: z.string().optional(),
});

export async function createLocation(formData: FormData) {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.LOCATIONS_CREATE);
    const userId = sessionUser.user.id;

    // Parse latitude and longitude safely
    const latStr = formData.get('latitude') as string;
    const lngStr = formData.get('longitude') as string;
    
    // Parse Image URLs safely
    const imageUrlsStr = formData.get('imageUrls') as string;
    let imageUrls: string[] = [];
    if (imageUrlsStr) {
       try {
         imageUrls = JSON.parse(imageUrlsStr);
       } catch (e) {
         // Silently fail parsing, remain empty array
       }
    }

    const inputData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string || 'pool',
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      country: formData.get('country') as string,
      latitude: latStr ? parseFloat(latStr) : null,
      longitude: lngStr ? parseFloat(lngStr) : null,
      waterTemperature: formData.get('waterTemperature') as string,
      priceGuide: formData.get('priceGuide') as string,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };

    const validated = createLocationSchema.safeParse(inputData);

    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const { data, error } = await supabaseAdmin
      .from('locations')
      .insert({
        created_by: userId,
        status: 'pending', // Always pending initially
        name: validated.data.name,
        description: validated.data.description || null,
        type: validated.data.type,
        address: validated.data.address || null,
        city: validated.data.city || null,
        country: validated.data.country || null,
        latitude: validated.data.latitude,
        longitude: validated.data.longitude,
        water_temperature: validated.data.waterTemperature || null,
        price_guide: validated.data.priceGuide || null,
        image_urls: validated.data.imageUrls || [],
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/locations');
    
    return { success: true, location: data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create location' };
  }
}

export async function getLocations(filters?: { status?: string, type?: string }) {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.LOCATIONS_READ);
    const userId = sessionUser.user.id;

    const { data: permissions } = await supabaseAdmin.rpc('get_user_permissions', { p_user_id: userId });
    const canManage = permissions?.some((p: any) => p.permission_name === PERMISSIONS.LOCATIONS_MANAGE);

    let query = supabaseAdmin
      .from('locations')
      .select(`
        *,
        users!created_by (name)
      `)
      .order('created_at', { ascending: false });

    // Admins can see everything unless filtered. Non-admins ONLY see approved OR their own pending/rejected spots.
    if (!canManage) {
       // Filter approved OR created_by = me
       query = query.or(`status.eq.approved,created_by.eq.${userId}`);
    }

    if (filters?.status && (canManage || filters.status === 'approved')) {
       query = query.eq('status', filters.status);
    }
    
    if (filters?.type) {
       query = query.eq('type', filters.type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, locations: data || [] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch locations' };
  }
}

export async function getLocationById(id: string) {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.LOCATIONS_READ);
    const userId = sessionUser.user.id;

    const { data: permissions } = await supabaseAdmin.rpc('get_user_permissions', { p_user_id: userId });
    const canManage = permissions?.some((p: any) => p.permission_name === PERMISSIONS.LOCATIONS_MANAGE);

    const { data, error } = await supabaseAdmin
      .from('locations')
      .select(`
        *,
        users!created_by (name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) throw error || new Error('Location not found');

    // Access control check
    if (!canManage && data.status !== 'approved' && data.created_by !== userId) {
       return { success: false, error: 'Forbidden. This location has not been approved.' };
    }

    return { success: true, location: data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch location' };
  }
}

export async function reviewLocation(formData: FormData) {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.LOCATIONS_MANAGE);
    const userId = sessionUser.user.id;

    const inputData = {
      id: formData.get('id') as string,
      status: formData.get('status') as string,
      adminNotes: formData.get('adminNotes') as string,
    };

    const validated = reviewLocationSchema.safeParse(inputData);

    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const { id, status, adminNotes } = validated.data;

    const { error } = await supabaseAdmin
      .from('locations')
      .update({
        status,
        admin_notes: adminNotes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId
      })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/locations');
    revalidatePath(`/dashboard/locations/${id}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to review location' };
  }
}

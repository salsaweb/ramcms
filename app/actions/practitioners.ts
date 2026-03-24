'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createPractitionerSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  bio: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  locationName: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const updatePractitionerSchema = z.object({
  id: z.string().uuid('Invalid practitioner ID'),
  bio: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  locationName: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  status: z.enum(['pending', 'active', 'inactive', 'suspended']).optional(),
});

/**
 * Get all practitioners (for admin panel)
 * 
 * Permission: practitioners.read
 */
export async function getPractitioners() {
  try {
    await requirePermission(PERMISSIONS.PRACTITIONERS_READ);

    const { data: practitioners, error } = await supabaseAdmin
      .from('practitioners')
      .select(`
        *,
        users (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: 'Failed to fetch practitioners: ' + error.message,
      };
    }

    return {
      success: true,
      practitioners: practitioners || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch practitioners',
    };
  }
}

/**
 * Get a practitioner by ID
 * 
 * Permission: practitioners.read
 */
export async function getPractitionerById(id: string) {
  try {
    await requirePermission(PERMISSIONS.PRACTITIONERS_READ);

    const { data: practitioner, error } = await supabaseAdmin
      .from('practitioners')
      .select('*, users (id, name, email, avatar_url)')
      .eq('id', id)
      .single();

    if (error) {
      return {
        success: false,
        error: 'Failed to fetch practitioner: ' + error.message,
      };
    }

    return {
      success: true,
      practitioner,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch practitioner',
    };
  }
}

/**
 * Get a practitioner by User ID
 * 
 * Permission: practitioners.read
 */
export async function getPractitionerByUserId(userId: string) {
  try {
    await requirePermission(PERMISSIONS.PRACTITIONERS_READ);

    const { data: practitioner, error } = await supabaseAdmin
      .from('practitioners')
      .select('*, users (id, name, email, avatar_url)')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return {
        success: false,
        error: 'Failed to fetch practitioner: ' + error.message,
      };
    }

    return {
      success: true,
      practitioner: practitioner || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch practitioner',
    };
  }
}

/**
 * Get users without practitioner profiles
 * 
 * Permission: practitioners.read AND users.read
 */
export async function getUsersWithoutPractitionerProfile() {
  try {
    await requirePermission(PERMISSIONS.PRACTITIONERS_READ);
    
    // We'll fetch active users, and fetch practitioner user_ids, then filter in memory for safety since dataset is small for this prototype.
    const { data: allUsers } = await supabaseAdmin.from('users').select('id, name, email').eq('is_active', true);
    const { data: pracs } = await supabaseAdmin.from('practitioners').select('user_id');
    
    const pracUserIds = new Set(pracs?.map(p => p.user_id) || []);
    const availableUsers = allUsers?.filter(u => !pracUserIds.has(u.id)) || [];

    return {
      success: true,
      users: availableUsers,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    };
  }
}

/**
 * Create a new practitioner
 * 
 * Permission: practitioners.create
 */
export async function createPractitioner(formData: {
  userId: string;
  bio?: string;
  website?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
}) {
  try {
    const session = await requirePermission(PERMISSIONS.PRACTITIONERS_CREATE);
    const adminId = session.user.id;

    const validated = createPractitionerSchema.safeParse(formData);
    
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0].message,
      };
    }

    const input = validated.data;

    const { data: practitioner, error } = await supabaseAdmin
      .from('practitioners')
      .insert({
        user_id: input.userId,
        bio: input.bio,
        website: input.website,
        location_name: input.locationName,
        latitude: input.latitude,
        longitude: input.longitude,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: 'Failed to create practitioner: ' + error.message,
      };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'practitioner.create',
      resource_type: 'practitioners',
      resource_id: practitioner.id,
      metadata: { linked_user: input.userId },
    });

    revalidatePath('/dashboard/practitioners');

    return {
      success: true,
      practitioner,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create practitioner',
    };
  }
}

/**
 * Update a practitioner
 * 
 * Permission: practitioners.update
 */
export async function updatePractitioner(formData: {
  id: string;
  bio?: string;
  website?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  status?: 'pending' | 'active' | 'inactive' | 'suspended';
}) {
  try {
    const session = await requirePermission(PERMISSIONS.PRACTITIONERS_UPDATE);
    const adminId = session.user.id;

    const validated = updatePractitionerSchema.safeParse(formData);
    
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0].message,
      };
    }

    const { id, ...updates } = validated.data;
    const cleanUpdates: any = { ...updates, updated_at: new Date().toISOString() };

    if (updates.locationName !== undefined) {
      cleanUpdates.location_name = updates.locationName;
      delete cleanUpdates.locationName;
    }

    const { data: practitioner, error } = await supabaseAdmin
      .from('practitioners')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: 'Failed to update practitioner: ' + error.message,
      };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'practitioner.update',
      resource_type: 'practitioners',
      resource_id: id,
      metadata: cleanUpdates,
    });

    revalidatePath('/dashboard/practitioners');

    return {
      success: true,
      practitioner,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update practitioner',
    };
  }
}

/**
 * Delete a practitioner
 * 
 * Permission: practitioners.delete
 */
export async function deletePractitioner(id: string) {
  try {
    const session = await requirePermission(PERMISSIONS.PRACTITIONERS_DELETE);
    const adminId = session.user.id;

    const { error } = await supabaseAdmin
      .from('practitioners')
      .delete()
      .eq('id', id);

    if (error) {
      return {
        success: false,
        error: 'Failed to delete practitioner: ' + error.message,
      };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'practitioner.delete',
      resource_type: 'practitioners',
      resource_id: id,
    });

    revalidatePath('/dashboard/practitioners');

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete practitioner',
    };
  }
}

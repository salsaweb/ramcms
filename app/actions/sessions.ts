'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createSessionSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  scheduledAt: z.string().datetime('Invalid scheduled time'),
  durationMinutes: z.number().int().min(15).max(480).default(60),
  locationId: z.string().uuid().optional(),
  status: z.enum(['requested', 'confirmed', 'completed', 'cancelled', 'no_show']).default('requested'),
  internalNotes: z.string().optional(),
  clientNotes: z.string().optional(),
});

const updateSessionSchema = z.object({
  id: z.string().uuid('Invalid session ID'),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  locationId: z.string().uuid().optional().nullable(),
  status: z.enum(['requested', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  internalNotes: z.string().optional(),
  clientNotes: z.string().optional(),
});

/**
 * Ensures the user has a practitioner profile and returns it
 */
async function getMyPractitionerProfile(userId: string) {
  const { data: practitioner, error } = await supabaseAdmin
    .from('practitioners')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (error || !practitioner) {
    throw new Error('User is not a registered practitioner');
  }

  return practitioner;
}

/**
 * Get all sessions (Practitioners see their own, Admin sees all)
 */
export async function getSessions(filters?: { status?: string, upcomingOnly?: boolean, clientId?: string, practitionerId?: string }) {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.SESSIONS_READ);
    const userId = sessionUser.user.id;

    // Check if user is admin
    const { data: permissions } = await supabaseAdmin.rpc('get_user_permissions', { p_user_id: userId });
    const isAdmin = permissions?.some((p: any) => p.permission_name === PERMISSIONS.USERS_READ);

    let query = supabaseAdmin
      .from('sessions')
      .select(`
        *,
        contacts!client_id (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        practitioners!practitioner_id (
          id,
          users (name, email)
        ),
        session_feedback (
          id
        )
      `)
      .order('scheduled_at', { ascending: filters?.upcomingOnly ? true : false });

    // Ensure clients view only their own practitioners' clients
    if (!isAdmin) {
      const practitioner = await getMyPractitionerProfile(userId);
      query = query.eq('practitioner_id', practitioner.id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.upcomingOnly) {
      query = query.gte('scheduled_at', new Date().toISOString());
    }

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    
    if (isAdmin && filters?.practitionerId) {
      query = query.eq('practitioner_id', filters.practitionerId);
    }

    const { data: sessions, error } = await query;

    if (error) throw error;

    return { success: true, sessions: sessions || [], isAdmin };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch sessions' };
  }
}

/**
 * Get a specific session by ID
 */
export async function getSessionById(id: string) {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.SESSIONS_READ);
    const userId = sessionUser.user.id;

    // Fetch session and owner info
    const { data: sessionData, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        *,
        contacts!client_id (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        practitioners!practitioner_id (
          id,
          user_id
        ),
        session_feedback (
          id
        )
      `)
      .eq('id', id)
      .single();

    if (error || !sessionData) {
      return { success: false, error: 'Session not found' };
    }

    // Check if user is admin
    const { data: permissions } = await supabaseAdmin.rpc('get_user_permissions', { p_user_id: userId });
    const isAdmin = permissions?.some((p: any) => p.permission_name === PERMISSIONS.USERS_READ);

    // If not admin, verify ownership
    if (!isAdmin && sessionData.practitioners.user_id !== userId) {
      // Is it the client?
      const { data: contactCheck } = await supabaseAdmin
         .from('contacts')
         .select('id')
         .eq('id', sessionData.client_id)
         .eq('user_id', userId)
         .maybeSingle();
         
      if (!contactCheck) {
         return { success: false, error: 'Forbidden' };
      }
    }

    return { success: true, session: sessionData };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch session' };
  }
}

/**
 * Create a new session
 */
export async function createSession(formData: FormData) {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.SESSIONS_CREATE);
    const userId = sessionUser.user.id;
    const practitioner = await getMyPractitionerProfile(userId);

    const inputData = {
      clientId: formData.get('clientId') as string,
      scheduledAt: formData.get('scheduledAt') as string,
      durationMinutes: parseInt(formData.get('durationMinutes') as string || '60', 10),
      status: formData.get('status') as string || 'requested',
      internalNotes: formData.get('internalNotes') as string,
      clientNotes: formData.get('clientNotes') as string,
    };

    const validated = createSessionSchema.safeParse(inputData);

    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const input = validated.data;

    // Verify client belongs to this practitioner
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('id', input.clientId)
      .eq('owner_id', userId)
      .single();

    if (!client || clientErr) {
        return { success: false, error: 'Client not found or unowned' };
    }

    const { data: sessionDoc, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        practitioner_id: practitioner.id,
        client_id: input.clientId,
        scheduled_at: input.scheduledAt,
        duration_minutes: input.durationMinutes,
        status: input.status,
        internal_notes: input.internalNotes || null,
        client_notes: input.clientNotes || null,
        location_id: input.locationId || null,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/sessions');
    revalidatePath('/dashboard');

    return { success: true, session: sessionDoc };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create session' };
  }
}

/**
 * Update a session
 */
export async function updateSession(formData: FormData) {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.SESSIONS_UPDATE);
    const userId = sessionUser.user.id;

    const inputData = {
      id: formData.get('id') as string,
      scheduledAt: formData.get('scheduledAt') as string,
      durationMinutes: formData.has('durationMinutes') ? parseInt(formData.get('durationMinutes') as string, 10) : undefined,
      status: formData.get('status') as string,
      internalNotes: formData.get('internalNotes') as string,
      clientNotes: formData.get('clientNotes') as string,
    };

    // Remove undefined fields before parsing to allow partial updates
    const cleanedInput = Object.fromEntries(Object.entries(inputData).filter(([_, v]) => v !== '' && v !== undefined && v !== null));

    const validated = updateSessionSchema.safeParse(cleanedInput);

    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const { id, ...updates } = validated.data;

    // Verify ownership
    const { data: sessionData, error: fetchErr } = await supabaseAdmin
      .from('sessions')
      .select('practitioner_id, practitioners(user_id)')
      .eq('id', id)
      .single();

    if (fetchErr || !sessionData) {
      return { success: false, error: 'Session not found' };
    }
    
    // Admin check
    const { data: permissions } = await supabaseAdmin.rpc('get_user_permissions', { p_user_id: userId });
    const isAdmin = permissions?.some((p: any) => p.permission_name === PERMISSIONS.USERS_READ);

    if (!isAdmin && (sessionData.practitioners as any).user_id !== userId) {
      return { success: false, error: 'Forbidden. Not your session.' };
    }

    const dbUpdates: any = {};
    if (updates.scheduledAt) dbUpdates.scheduled_at = updates.scheduledAt;
    if (updates.durationMinutes) dbUpdates.duration_minutes = updates.durationMinutes;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.internalNotes !== undefined) dbUpdates.internal_notes = updates.internalNotes;
    if (updates.clientNotes !== undefined) dbUpdates.client_notes = updates.clientNotes;
    if (updates.locationId !== undefined) dbUpdates.location_id = updates.locationId;
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('sessions')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/sessions');
    revalidatePath(`/dashboard/sessions/${id}`);
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update session' };
  }
}

/**
 * Update just the status of a session
 */
export async function updateSessionStatus(id: string, status: 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'no_show') {
  try {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('status', status);
    return updateSession(formData);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to mark session' };
  }
}

/**
 * Delete a session
 */
export async function deleteSession(id: string) {
    try {
      const sessionUser = await requirePermission(PERMISSIONS.SESSIONS_DELETE);
      const userId = sessionUser.user.id;
  
      // Verify ownership
      const { data: sessionData, error: fetchErr } = await supabaseAdmin
        .from('sessions')
        .select('practitioners(user_id)')
        .eq('id', id)
        .single();
  
      if (fetchErr || !sessionData) {
        return { success: false, error: 'Session not found' };
      }
      
      const { data: permissions } = await supabaseAdmin.rpc('get_user_permissions', { p_user_id: userId });
      const isAdmin = permissions?.some((p: any) => p.permission_name === PERMISSIONS.USERS_READ);
  
      if (!isAdmin && (sessionData.practitioners as any).user_id !== userId) {
        return { success: false, error: 'Forbidden' };
      }
  
      const { error } = await supabaseAdmin
        .from('sessions')
        .delete()
        .eq('id', id);
  
      if (error) throw error;
  
      revalidatePath('/dashboard/sessions');
      revalidatePath('/dashboard');
  
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete session' };
    }
  }
  

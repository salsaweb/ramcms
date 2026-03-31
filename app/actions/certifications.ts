'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const requestSchema = z.object({
  type: z.string().min(2).max(100),
});

const reviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
  adminNotes: z.string().optional(),
});

/**
 * Gets the practitioner details using their user ID
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
 * Calculates a practitioner's progress toward certification and returns any existing requests.
 */
export async function getCertificationProgress() {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.CERTIFICATIONS_READ);
    const userId = sessionUser.user.id;
    const practitioner = await getMyPractitionerProfile(userId);

    // 1. Count sessions that have received feedback
    const { count, error: countErr } = await supabaseAdmin
      .from('session_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('practitioner_id', practitioner.id);

    if (countErr) throw countErr;

    // 2. Fetch existing certification requests
    const { data: certifications, error: certErr } = await supabaseAdmin
      .from('certifications')
      .select('*')
      .eq('practitioner_id', practitioner.id)
      .order('submitted_at', { ascending: false });

    if (certErr) throw certErr;

    return { 
      success: true, 
      completedSessions: count || 0,
      certifications: certifications || [] 
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch certification progress' };
  }
}

/**
 * Submits a new certification request
 */
export async function requestCertification(formData: FormData) {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.CERTIFICATIONS_REQUEST);
    const userId = sessionUser.user.id;
    const practitioner = await getMyPractitionerProfile(userId);

    const type = formData.get('type') as string || 'Janzu Practitioner';
    const validated = requestSchema.safeParse({ type });

    if (!validated.success) {
      return { success: false, error: 'Invalid certification type' };
    }

    // Verify they actually have 50 feedbacks (double-check server side)
    const { count } = await supabaseAdmin
      .from('session_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('practitioner_id', practitioner.id);

    if ((count || 0) < 50) {
      return { success: false, error: 'You have not reached the required 50 completed sessions yet.' };
    }

    const { data: cert, error } = await supabaseAdmin
      .from('certifications')
      .insert({
        practitioner_id: practitioner.id,
        type: validated.data.type,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
       if (error.code === '23505') {
          return { success: false, error: 'You already have an active request for this certification type.' };
       }
       throw error;
    }

    revalidatePath('/dashboard/certifications');
    
    return { success: true, certification: cert };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to request certification' };
  }
}

/**
 * ADMIN ONLY: Fetch all pending/history of certifications
 */
export async function getAllCertifications(statusFilter?: 'pending' | 'approved' | 'rejected') {
  try {
    await requirePermission(PERMISSIONS.CERTIFICATIONS_MANAGE);

    let query = supabaseAdmin
      .from('certifications')
      .select(`
        *,
        practitioners!practitioner_id (
          id,
          users (
            name,
            email
          )
        )
      `)
      .order('submitted_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, certifications: data || [] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch certifications' };
  }
}

/**
 * ADMIN ONLY: Approve or Reject a certification
 */
export async function reviewCertification(formData: FormData) {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.CERTIFICATIONS_MANAGE);
    const userId = sessionUser.user.id;

    const inputData = {
      id: formData.get('id') as string,
      status: formData.get('status') as string,
      adminNotes: formData.get('adminNotes') as string,
    };

    const validated = reviewSchema.safeParse(inputData);

    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const { id, status, adminNotes } = validated.data;

    const { error } = await supabaseAdmin
      .from('certifications')
      .update({
        status,
        admin_notes: adminNotes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId
      })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/certifications');

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to review certification' };
  }
}

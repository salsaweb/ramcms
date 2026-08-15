'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { z } from 'zod';

const feedbackSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  feelingInArms: z.string().min(1, 'Please tell us how you felt'),
  overallExperience: z.string().min(1, 'Please describe your overall experience'),
  feltSupported: z.enum(['Yes', 'Not enough', 'Other'], {
    required_error: 'Please select an option',
  }),
  feltSupportedDetails: z.string().optional(),
  additionalComments: z.string().min(1, 'Please provide any additional comments'),
  continueProcess: z.enum(['I would like to receive another session', 'No, thank you'], {
    required_error: 'Please select an option',
  }),
  interestedInLearning: z.boolean().default(false),
});

/**
 * Publicly accessible function to fetch basic session details to present on the feedback form.
 * Does not require authentication, but requires a valid session UUID.
 */
export async function getSessionForFeedback(sessionId: string) {
  try {
    const { data: sessionData, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        id,
        scheduled_at,
        client_id,
        practitioner_id,
        contacts!client_id (
          first_name,
          last_name
        ),
        practitioners!practitioner_id (
          users (
            name
          )
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error || !sessionData) {
      return { success: false, error: 'Session not found' };
    }

    // Check if feedback already exists
    const { data: existingFeedback } = await supabaseAdmin
      .from('session_feedback')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existingFeedback) {
      return { success: false, error: 'Feedback has already been submitted for this session.' };
    }

    return { success: true, session: sessionData };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Publicly accessible function to submit feedback.
 */
export async function submitFeedback(formData: FormData) {
  try {
    const inputData = {
      sessionId: formData.get('sessionId') as string,
      feelingInArms: formData.get('feelingInArms') as string,
      overallExperience: formData.get('overallExperience') as string,
      feltSupported: formData.get('feltSupported') as string,
      feltSupportedDetails: formData.get('feltSupportedDetails') as string,
      additionalComments: formData.get('additionalComments') as string,
      continueProcess: formData.get('continueProcess') as string,
      interestedInLearning: formData.get('interestedInLearning') === 'on' || formData.get('interestedInLearning') === 'true',
    };

    const validated = feedbackSchema.safeParse(inputData);

    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const { sessionId, feelingInArms, overallExperience, feltSupported, feltSupportedDetails, additionalComments, continueProcess, interestedInLearning } = validated.data;

    // Verify session existence and grab IDs
    const sessionRes = await getSessionForFeedback(sessionId);
    if (!sessionRes.success || !sessionRes.session) {
      return { success: false, error: sessionRes.error || 'Invalid session' };
    }

    const session = sessionRes.session;

    const { error } = await supabaseAdmin
      .from('session_feedback')
      .insert({
        session_id: sessionId,
        client_id: session.client_id,
        practitioner_id: session.practitioner_id,
        feeling_in_arms: feelingInArms,
        overall_experience: overallExperience,
        felt_supported: feltSupported,
        felt_supported_details: feltSupported === 'Other' ? feltSupportedDetails : null,
        additional_comments: additionalComments,
        continue_process: continueProcess,
        interested_in_learning: interestedInLearning,
      });

    if (error) {
      // Handle unique constraint violation specifically (if double submit happens)
      if (error.code === '23505') {
         return { success: false, error: 'Feedback already submitted for this session.' };
      }
      throw error;
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to submit feedback' };
  }
}

/**
 * Fetch feedback assigned to a practitioner (Requires Auth).
 * Admins may pass an optional practitionerId to filter by a specific facilitator.
 */
export async function getPractitionerFeedback(practitionerIdFilter?: string) {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.FEEDBACK_READ);
    const userId = sessionUser.user.id;

    // Check if user is admin
    const { data: permissions } = await supabaseAdmin.rpc('get_user_permissions', { p_user_id: userId });
    const isAdmin = permissions?.some((p: any) => p.permission_name === PERMISSIONS.USERS_READ);

    let query = supabaseAdmin
      .from('session_feedback')
      .select(`
        *,
        sessions (
          scheduled_at
        ),
        contacts!client_id (
          first_name,
          last_name
        ),
        practitioners!practitioner_id (
          users (
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      // Non-admins: restrict to their own practitioner profile
      const { data: practitioner } = await supabaseAdmin
        .from('practitioners')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!practitioner) {
        return { success: false, error: 'Not a practitioner' };
      }

      query = query.eq('practitioner_id', practitioner.id);
    } else if (practitionerIdFilter) {
      // Admins: apply optional filter
      query = query.eq('practitioner_id', practitionerIdFilter);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, feedback: data || [], isAdmin };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch feedback' };
  }
}

/**
 * Returns a minimal list of practitioners (id + name) for use in admin filter dropdowns.
 * Requires admin privileges (USERS_READ permission).
 */
export async function getAllPractitionersForFilter() {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.USERS_READ);
    const userId = sessionUser.user.id;

    const { data: permissions } = await supabaseAdmin.rpc('get_user_permissions', { p_user_id: userId });
    const isAdmin = permissions?.some((p: any) => p.permission_name === PERMISSIONS.USERS_READ);

    if (!isAdmin) {
      return { success: false, error: 'Forbidden' };
    }

    const { data, error } = await supabaseAdmin
      .from('practitioners')
      .select(`
        id,
        users (
          name
        )
      `)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, practitioners: data || [] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch practitioners' };
  }
}

/**
 * Fetch a specific feedback entry by ID
 */
export async function getFeedbackById(id: string) {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.FEEDBACK_READ);
    const userId = sessionUser.user.id;

    const { data: permissions } = await supabaseAdmin.rpc('get_user_permissions', { p_user_id: userId });
    const isAdmin = permissions?.some((p: any) => p.permission_name === PERMISSIONS.USERS_READ);

    let query = supabaseAdmin
      .from('session_feedback')
      .select(`
        *,
        sessions (
          scheduled_at
        ),
        contacts!client_id (
          first_name,
          last_name
        ),
        practitioners!practitioner_id (
          user_id,
          users (
            name
          )
        )
      `)
      .eq('id', id)
      .single();

    const { data, error } = await query;

    if (error || !data) throw error || new Error('Not found');

    // If not admin, restrict to their own practitioner profile
    if (!isAdmin) {
      if ((data.practitioners as any).user_id !== userId) {
        return { success: false, error: 'Forbidden' };
      }
    }

    return { success: true, feedback: data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch feedback details' };
  }
}

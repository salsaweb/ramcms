'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
// import { requirePermission } from '@/lib/rbac/guards';
// import { PERMISSIONS } from '@/lib/rbac/permissions';
import { revalidatePath } from 'next/cache';

/**
 * Processes an application.
 * @param {Object} input - The input object.
 * @param {string} input.applicationId - The ID of the application to process.
 * @returns {Promise<Object>} - The result object.
 */
export async function processApplication({ applicationId, status, contactId, dealId }: { applicationId: string, status: string, contactId?: string, dealId?: string }) {
    try {
        // const session = await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);
        const updateData: any = {
            status: status
        };

        if (contactId) {
            updateData.contact_id = contactId;
        }

        if (dealId) {
            updateData.deal_id = dealId;
        }

        const { error } = await supabaseAdmin
            .from('pilot_applications')
            .update(updateData)
            .eq('id', applicationId);

        if (error) {
            console.error('Failed to process application:', error);
            return { success: false, error: error.message };
        }

        revalidatePath(`/dashboard/applications/${applicationId}`);
        return { success: true };
    } catch (error) {
        console.error('Exception processing application:', error);
        return { success: false, error: 'An error occurred while processing the application' };
    }
}

/**
 * Fetches all applications for the current user.
 * @returns {Promise<Array<Object>>} - List of applications.
 */
export async function getApplications() {
    try {
        // const session = await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);

        const { data: applications, error } = await supabaseAdmin
            .from('pilot_applications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch applications:', error);
            return [];
        }

        return applications || [];
    } catch (error) {
        console.error('Exception fetching applications:', error);
        return [];
    }
}

/**
 * Fetches a single application by its ID.
 * @param {string} id - The ID of the application to fetch.
 * @returns {Promise<Object|null>} - The application object or null if not found.
 */
export async function getApplicationById(id: string) {
    try {
        // const session = await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);

        const { data: application, error } = await supabaseAdmin
            .from('pilot_applications')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // No rows returned
            }
            console.error('Failed to fetch application:', error);
            return null;
        }

        return application || null;
    } catch (error) {
        console.error('Exception fetching application:', error);
        return null;
    }
}

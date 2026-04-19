'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
// import { requirePermission } from '@/lib/rbac/guards';
// import { PERMISSIONS } from '@/lib/rbac/permissions';

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

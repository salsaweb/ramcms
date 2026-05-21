'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { revalidatePath } from 'next/cache';

// Internal utility to dispatch notifications from other server actions
export async function dispatchNotification(params: {
  userId: string;
  type: 'system' | 'session_request' | 'feedback' | 'certification' | 'event';
  title: string;
  message: string;
  linkUrl?: string;
}) {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: params.userId,
                type: params.type,
                title: params.title,
                message: params.message,
                link_url: params.linkUrl || null,
                is_read: false
            });
            
        if (error) {
            console.error('Failed to dispatch notification:', error);
        }
        
    } catch (e) {
        console.error('Error dispatching notification:', e);
    }
}

export async function getUnreadNotificationsCount() {
    try {
        const sessionUser = await requirePermission(PERMISSIONS.NOTIFICATIONS_READ);
        const userId = sessionUser.user.id;

        const { count, error } = await supabaseAdmin
            .from('notifications')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        
        return { success: true, count: count || 0 };
    } catch (error) {
        return { success: false, error: 'Failed to fetch notification count', count: 0 };
    }
}

export async function getRecentNotifications(limit: number = 5) {
    try {
        const sessionUser = await requirePermission(PERMISSIONS.NOTIFICATIONS_READ);
        const userId = sessionUser.user.id;

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        
        return { success: true, notifications: data || [] };
    } catch (error) {
        return { success: false, error: 'Failed to fetch notifications', notifications: [] };
    }
}

export async function getAllNotifications() {
    try {
        const sessionUser = await requirePermission(PERMISSIONS.NOTIFICATIONS_READ);
        const userId = sessionUser.user.id;

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return { success: true, notifications: data || [] };
    } catch (error) {
        return { success: false, error: 'Failed to fetch notifications', notifications: [] };
    }
}

export async function markNotificationAsRead(id: string) {
    try {
        const sessionUser = await requirePermission(PERMISSIONS.NOTIFICATIONS_UPDATE);
        const userId = sessionUser.user.id;

        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('id', id);

        if (error) throw error;
        
        revalidatePath('/dashboard/notifications');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update status' };
    }
}

export async function markAllNotificationsAsRead() {
    try {
        const sessionUser = await requirePermission(PERMISSIONS.NOTIFICATIONS_UPDATE);
        const userId = sessionUser.user.id;

        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/notifications');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update all statuses' };
    }
}

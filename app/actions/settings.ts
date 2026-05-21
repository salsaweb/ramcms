'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { revalidatePath } from 'next/cache';

/**
 * Get all system settings
 * 
 * Permission: settings.view
 */
export async function getSettings() {
  try {
    await requirePermission(PERMISSIONS.SETTINGS_VIEW);

    const { data: settings, error } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .order('key');

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      settings: settings || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch settings',
    };
  }
}

/**
 * Get a specific setting by key (Internal utility, works without specific permission check, used by other actions)
 */
export async function getSettingByKey(key: string) {
  try {
    const { data: setting, error } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(`Error fetching setting ${key}:`, error.message);
      return null;
    }

    return setting ? setting.value : null;
  } catch (error) {
    console.error(`Exception fetching setting ${key}:`, error);
    return null;
  }
}

/**
 * Update system settings
 * 
 * Permission: settings.manage
 */
export async function updateSettings(updates: Record<string, any>) {
  try {
    const session = await requirePermission(PERMISSIONS.SETTINGS_MANAGE);
    const adminId = session.user.id;

    for (const [key, value] of Object.entries(updates)) {
      const { error } = await supabaseAdmin
        .from('system_settings')
        .upsert({
          key,
          value,
          updated_by: adminId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) {
        throw new Error(`Failed to update ${key}: ${error.message}`);
      }
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'settings.update',
      resource_type: 'system_settings',
      metadata: { keys: Object.keys(updates) },
    });

    revalidatePath('/dashboard/settings');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings',
    };
  }
}

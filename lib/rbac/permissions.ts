/**
 * RBAC Permissions Module
 * 
 * Core principle: Check PERMISSIONS, not ROLES.
 * 
 * WRONG: if (user.role === 'admin') { ... }
 * RIGHT: if (hasPermission(user, 'posts.delete')) { ... }
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Permission type - follows resource.action naming convention
 */
export type Permission = string;

/**
 * User permissions interface
 */
export interface UserPermissions {
  userId: string;
  permissions: Permission[];
}

/**
 * Fetch all permissions for a user
 * 
 * Uses SQL function for optimized joins across:
 * users -> user_roles -> role_permissions -> permissions
 * 
 * @param userId - User UUID
 * @returns Promise<Permission[]> - Array of permission strings
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_user_permissions', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Failed to fetch user permissions:', error);
      return [];
    }

    return (data || []).map((row: { permission_name: string }) => row.permission_name);
  } catch (err) {
    console.error('Error in getUserPermissions:', err);
    return [];
  }
}

/**
 * Check if user has a specific permission
 * 
 * @param userId - User UUID
 * @param permission - Permission string (e.g., 'posts.create')
 * @returns Promise<boolean>
 */
export async function userHasPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

/**
 * Check if user has ANY of the specified permissions
 * 
 * @param userId - User UUID
 * @param permissions - Array of permission strings
 * @returns Promise<boolean>
 */
export async function userHasAnyPermission(
  userId: string,
  permissions: Permission[]
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  return permissions.some(p => userPerms.includes(p));
}

/**
 * Check if user has ALL specified permissions
 * 
 * @param userId - User UUID
 * @param permissions - Array of permission strings
 * @returns Promise<boolean>
 */
export async function userHasAllPermissions(
  userId: string,
  permissions: Permission[]
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  return permissions.every(p => userPerms.includes(p));
}

/**
 * Get user's roles (for display purposes only, NOT for authorization)
 * 
 * @param userId - User UUID
 * @returns Promise<string[]> - Array of role names
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, roles(name)')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to fetch user roles:', error);
      return [];
    }

    return (data || []).map((row: any) => row.roles.name);
  } catch (err) {
    console.error('Error in getUserRoles:', err);
    return [];
  }
}

/**
 * Assign a role to a user
 * 
 * @param userId - User UUID
 * @param roleId - Role ID
 * @param assignedBy - UUID of user performing the assignment
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function assignUserRole(
  userId: string,
  roleId: number,
  assignedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Revoke a role from a user
 * 
 * @param userId - User UUID
 * @param roleId - Role ID
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function revokeUserRole(
  userId: string,
  roleId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Permission groups for easier checking
 */
export const PERMISSIONS = {
  // User Management
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE_ROLES: 'users.manage_roles',

  // Post Management
  POSTS_CREATE: 'posts.create',
  POSTS_READ: 'posts.read',
  POSTS_UPDATE: 'posts.update',
  POSTS_DELETE: 'posts.delete',
  POSTS_PUBLISH: 'posts.publish',
  POSTS_UPDATE_OWN: 'posts.update_own',

  // Categories & Tags
  CATEGORIES_MANAGE: 'categories.manage',
  TAGS_MANAGE: 'tags.manage',

  // Media
  MEDIA_ACCESS: 'media.access',
  
  // Tracks
  TRACKS_CREATE: 'tracks.create',
  TRACKS_READ: 'tracks.read',
  TRACKS_UPDATE: 'tracks.update',
  TRACKS_DELETE: 'tracks.delete',
  
  // Playlists
  PLAYLISTS_CREATE: 'playlists.create',
  PLAYLISTS_READ: 'playlists.read',
  PLAYLISTS_UPDATE: 'playlists.update',
  PLAYLISTS_DELETE: 'playlists.delete',

  // Practitioners
  PRACTITIONERS_CREATE: 'practitioners.create',
  PRACTITIONERS_READ: 'practitioners.read',
  PRACTITIONERS_UPDATE: 'practitioners.update',
  PRACTITIONERS_DELETE: 'practitioners.delete',

  // Sessions
  SESSIONS_CREATE: 'sessions.create',
  SESSIONS_READ: 'sessions.read',
  SESSIONS_UPDATE: 'sessions.update',
  SESSIONS_DELETE: 'sessions.delete',

  // Feedback
  FEEDBACK_CREATE: 'feedback.create',
  FEEDBACK_READ: 'feedback.read',
  FEEDBACK_UPDATE: 'feedback.update',
  FEEDBACK_DELETE: 'feedback.delete',

  // Certifications
  CERTIFICATIONS_REQUEST: 'certifications.request',
  CERTIFICATIONS_READ: 'certifications.read',
  CERTIFICATIONS_MANAGE: 'certifications.manage',

  // Locations
  LOCATIONS_CREATE: 'locations.create',
  LOCATIONS_READ: 'locations.read',
  LOCATIONS_UPDATE: 'locations.update',
  LOCATIONS_MANAGE: 'locations.manage',

  // System
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',
  AUDIT_VIEW: 'audit.view',
  DASHBOARD_ACCESS: 'dashboard.access',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];
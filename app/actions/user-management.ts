/**
 * User Management Server Actions
 * 
 * Admin functionality to manage user roles and permissions
 */

'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.number().int().positive(),
});

const removeRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.number().int().positive(),
});

// =====================================================
// GET USER DETAILS WITH ROLES AND PERMISSIONS
// =====================================================

export async function getUserWithPermissions(userId: string) {
  try {
    await requirePermission('users.manage_roles');

    // Get user basic info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, is_active, created_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found' };
    }

    // Get user's roles
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select(`
        role_id,
        roles (
          id,
          name,
          description
        )
      `)
      .eq('user_id', userId);

    // Get user's permissions (computed from roles)
    const { data: permissions } = await supabaseAdmin.rpc('get_user_permissions', {
      p_user_id: userId,
    });

    return {
      success: true,
      user: {
        ...user,
        roles: userRoles?.map((ur: any) => ur.roles) || [],
        permissions: permissions || [],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user',
    };
  }
}

// =====================================================
// GET ALL AVAILABLE ROLES
// =====================================================

export async function getAllRoles() {
  try {
    await requirePermission('users.manage_roles');

    const { data: roles, error } = await supabaseAdmin
      .from('roles')
      .select(`
        id,
        name,
        description,
        is_system
      `)
      .order('name', { ascending: true });

    if (error) {
      return { success: false, error: 'Failed to fetch roles' };
    }

    // Get permission count for each role
    const rolesWithCounts = await Promise.all(
      (roles || []).map(async (role) => {
        const { count } = await supabaseAdmin
          .from('role_permissions')
          .select('*', { count: 'exact', head: true })
          .eq('role_id', role.id);

        return {
          ...role,
          permissionCount: count || 0,
        };
      })
    );

    return { success: true, roles: rolesWithCounts };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch roles',
    };
  }
}

// =====================================================
// GET ALL AVAILABLE PERMISSIONS
// =====================================================

export async function getAllPermissions() {
  try {
    await requirePermission('users.manage_roles');

    const { data: permissions, error } = await supabaseAdmin
      .from('permissions')
      .select('id, name, description, resource, action')
      .order('resource', { ascending: true })
      .order('action', { ascending: true });

    if (error) {
      return { success: false, error: 'Failed to fetch permissions' };
    }

    // Group by resource
    const grouped = (permissions || []).reduce((acc: any, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {});

    return { success: true, permissions: permissions || [], grouped };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch permissions',
    };
  }
}

// =====================================================
// ASSIGN ROLE TO USER
// =====================================================

export async function assignRoleToUser(data: z.infer<typeof assignRoleSchema>) {
  try {
    const session = await requirePermission('users.manage_roles');
    const adminId = session.user.id;

    const validated = assignRoleSchema.parse(data);

    // Check if user exists
    const { data: userExists } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', validated.userId)
      .single();

    if (!userExists) {
      return { success: false, error: 'User not found' };
    }

    // Check if role exists
    const { data: roleExists } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .eq('id', validated.roleId)
      .single();

    if (!roleExists) {
      return { success: false, error: 'Role not found' };
    }

    // Assign role
    const { error } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: validated.userId,
        role_id: validated.roleId,
        assigned_by: adminId,
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'User already has this role' };
      }
      return { success: false, error: 'Failed to assign role' };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'user.role_assigned',
      resource_type: 'users',
      resource_id: validated.userId,
      metadata: { role_id: validated.roleId, role_name: roleExists.name },
    });

    revalidatePath('/dashboard/users');
    revalidatePath(`/dashboard/users/${validated.userId}`);

    return { success: true };
  } catch (error) {
    console.error('Assign role error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to assign role' };
  }
}

// =====================================================
// REMOVE ROLE FROM USER
// =====================================================

export async function removeRoleFromUser(data: z.infer<typeof removeRoleSchema>) {
  try {
    const session = await requirePermission('users.manage_roles');
    const adminId = session.user.id;

    const validated = removeRoleSchema.parse(data);

    // Get role name for audit log
    const { data: role } = await supabaseAdmin
      .from('roles')
      .select('name')
      .eq('id', validated.roleId)
      .single();

    // Remove role
    const { error } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', validated.userId)
      .eq('role_id', validated.roleId);

    if (error) {
      return { success: false, error: 'Failed to remove role' };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'user.role_removed',
      resource_type: 'users',
      resource_id: validated.userId,
      metadata: { role_id: validated.roleId, role_name: role?.name },
    });

    revalidatePath('/dashboard/users');
    revalidatePath(`/dashboard/users/${validated.userId}`);

    return { success: true };
  } catch (error) {
    console.error('Remove role error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to remove role' };
  }
}

// =====================================================
// UPDATE USER STATUS (ACTIVATE/DEACTIVATE)
// =====================================================

export async function updateUserStatus(userId: string, isActive: boolean) {
  try {
    const session = await requirePermission('users.update');
    const adminId = session.user.id;

    // Prevent admin from deactivating themselves
    if (userId === adminId && !isActive) {
      return { success: false, error: 'You cannot deactivate your own account' };
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (error) {
      return { success: false, error: 'Failed to update user status' };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: isActive ? 'user.activated' : 'user.deactivated',
      resource_type: 'users',
      resource_id: userId,
    });

    revalidatePath('/dashboard/users');
    revalidatePath(`/dashboard/users/${userId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user status',
    };
  }
}

// =====================================================
// GET ROLE WITH PERMISSIONS
// =====================================================

export async function getRoleWithPermissions(roleId: number) {
  try {
    await requirePermission('users.manage_roles');

    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name, description, is_system')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      return { success: false, error: 'Role not found' };
    }

    // Get role's permissions
    const { data: rolePermissions } = await supabaseAdmin
      .from('role_permissions')
      .select(`
        permission_id,
        permissions (
          id,
          name,
          description,
          resource,
          action
        )
      `)
      .eq('role_id', roleId);

    return {
      success: true,
      role: {
        ...role,
        permissions: rolePermissions?.map((rp: any) => rp.permissions) || [],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch role',
    };
  }
}

// =====================================================
// UPDATE ROLE PERMISSIONS
// =====================================================

export async function updateRolePermissions(roleId: number, permissionIds: number[]) {
  try {
    const session = await requirePermission('users.manage_roles');
    const adminId = session.user.id;

    // Check if role is system role
    const { data: role } = await supabaseAdmin
      .from('roles')
      .select('is_system, name')
      .eq('id', roleId)
      .single();

    if (!role) {
      return { success: false, error: 'Role not found' };
    }

    // Warn about modifying system roles
    if (role.is_system) {
      // Still allow, but we could add extra checks here
      console.warn(`Modifying system role: ${role.name}`);
    }

    // Delete existing permissions
    await supabaseAdmin
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    // Insert new permissions
    if (permissionIds.length > 0) {
      const { error } = await supabaseAdmin
        .from('role_permissions')
        .insert(
          permissionIds.map((permId) => ({
            role_id: roleId,
            permission_id: permId,
          }))
        );

      if (error) {
        return { success: false, error: 'Failed to update role permissions' };
      }
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'role.permissions_updated',
      resource_type: 'roles',
      resource_id: roleId.toString(),
      metadata: { role_name: role.name, permission_count: permissionIds.length },
    });

    revalidatePath('/dashboard/users');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update role permissions',
    };
  }
}
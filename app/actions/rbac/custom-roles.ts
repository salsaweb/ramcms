/**
 * Custom RBAC Management Actions
 * 
 * Create, update, delete custom roles and manage permissions
 */

'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// =====================================================
// SCHEMAS
// =====================================================

const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  permissionIds: z.array(z.number()),
});

const updateRoleSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const cloneRoleSchema = z.object({
  sourceRoleId: z.number(),
  newName: z.string().min(1).max(100),
  newDescription: z.string().optional(),
});

// =====================================================
// GET ROLES & PERMISSIONS
// =====================================================

export async function getAllRoles() {
  try {
    await requirePermission('roles.read');

    const { data, error } = await supabaseAdmin
      .from('roles_with_stats')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return { success: false, error: 'Failed to fetch roles' };
    }

    return { success: true, roles: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch roles',
    };
  }
}

export async function getRoleDetails(roleId: number) {
  try {
    await requirePermission('roles.read');

    // Get role with permissions
    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select(`
        *,
        role_permissions(
          permission:permissions(*)
        )
      `)
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      return { success: false, error: 'Role not found' };
    }

    // Get user count
    const { count } = await supabaseAdmin
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', roleId);

    // Get audit log
    const { data: auditLog } = await supabaseAdmin
      .from('role_audit_log')
      .select(`
        *,
        user:users(name, email)
      `)
      .eq('role_id', roleId)
      .order('created_at', { ascending: false })
      .limit(20);

    return {
      success: true,
      role: {
        ...role,
        user_count: count || 0,
        audit_log: auditLog || [],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch role details',
    };
  }
}

export async function getAllPermissions() {
  try {
    await requirePermission('permissions.read');

    const { data, error } = await supabaseAdmin
      .from('permissions_grouped')
      .select('*')
      .order('group_sort_order', { ascending: true });

    if (error) {
      return { success: false, error: 'Failed to fetch permissions' };
    }

    // Group permissions by group
    const grouped = (data || []).reduce((acc: any, perm: any) => {
      const groupName = perm.group_name || 'Uncategorized';
      if (!acc[groupName]) {
        acc[groupName] = {
          name: groupName,
          icon: perm.group_icon,
          permissions: [],
        };
      }
      acc[groupName].permissions.push(perm);
      return acc;
    }, {});

    return { success: true, permissions: Object.values(grouped) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch permissions',
    };
  }
}

export async function getRoleTemplates() {
  try {
    await requirePermission('roles.read');

    const { data, error } = await supabaseAdmin
      .from('role_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      return { success: false, error: 'Failed to fetch templates' };
    }

    return { success: true, templates: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch templates',
    };
  }
}

// =====================================================
// CREATE ROLE
// =====================================================

export async function createCustomRole(data: z.infer<typeof createRoleSchema>) {
  try {
    const session = await requirePermission('roles.create');
    const userId = session.user.id;

    const validated = createRoleSchema.parse(data);

    // Check if name is available
    const { data: existing } = await supabaseAdmin
      .from('roles')
      .select('id')
      .ilike('name', validated.name)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'Role name already exists' };
    }

    // Create role
    const { data: newRole, error: roleError } = await supabaseAdmin
      .from('roles')
      .insert({
        name: validated.name,
        description: validated.description || null,
        color: validated.color || null,
        icon: validated.icon || null,
        is_system: false,
      })
      .select()
      .single();

    if (roleError || !newRole) {
      return { success: false, error: 'Failed to create role' };
    }

    // Assign permissions
    if (validated.permissionIds.length > 0) {
      const permissionMappings = validated.permissionIds.map((permId) => ({
        role_id: newRole.id,
        permission_id: permId,
      }));

      const { error: permError } = await supabaseAdmin
        .from('role_permissions')
        .insert(permissionMappings);

      if (permError) {
        // Rollback role creation
        await supabaseAdmin.from('roles').delete().eq('id', newRole.id);
        return { success: false, error: 'Failed to assign permissions' };
      }
    }

    // Audit log
    await supabaseAdmin.from('role_audit_log').insert({
      role_id: newRole.id,
      action: 'created',
      changed_by: userId,
      changes: {
        name: validated.name,
        permission_count: validated.permissionIds.length,
      },
    });

    // Also log in main audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'role.create',
      resource_type: 'roles',
      resource_id: newRole.id.toString(),
      metadata: { role_name: validated.name },
    });

    revalidatePath('/dashboard/roles');

    return { success: true, role: newRole };
  } catch (error) {
    console.error('Create role error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to create role' };
  }
}

// =====================================================
// CREATE FROM TEMPLATE
// =====================================================

export async function createRoleFromTemplate(
  templateId: number,
  roleName: string,
  roleDescription?: string
) {
  try {
    const session = await requirePermission('roles.create');
    const userId = session.user.id;

    const { data: roleId, error } = await supabaseAdmin.rpc('create_role_from_template', {
      p_template_id: templateId,
      p_role_name: roleName,
      p_role_description: roleDescription || null,
      p_created_by: userId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Log in main audit
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'role.create_from_template',
      resource_type: 'roles',
      resource_id: roleId.toString(),
      metadata: { template_id: templateId, role_name: roleName },
    });

    revalidatePath('/dashboard/roles');

    return { success: true, roleId };
  } catch (error) {
    console.error('Create from template error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create role from template',
    };
  }
}

// =====================================================
// UPDATE ROLE
// =====================================================

export async function updateCustomRole(data: z.infer<typeof updateRoleSchema>) {
  try {
    const session = await requirePermission('roles.update');
    const userId = session.user.id;

    const validated = updateRoleSchema.parse(data);

    // Check if role exists and is not system
    const { data: role } = await supabaseAdmin
      .from('roles')
      .select('is_system, name')
      .eq('id', validated.id)
      .single();

    if (!role) {
      return { success: false, error: 'Role not found' };
    }

    if (role.is_system) {
      return { success: false, error: 'Cannot modify system role' };
    }

    // If changing name, check availability
    if (validated.name && validated.name !== role.name) {
      const { data: existing } = await supabaseAdmin
        .from('roles')
        .select('id')
        .ilike('name', validated.name)
        .neq('id', validated.id)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Role name already exists' };
      }
    }

    // Update role
    const updates: any = {};
    if (validated.name) updates.name = validated.name;
    if (validated.description !== undefined) updates.description = validated.description;
    if (validated.color !== undefined) updates.color = validated.color;
    if (validated.icon !== undefined) updates.icon = validated.icon;

    const { error: updateError } = await supabaseAdmin
      .from('roles')
      .update(updates)
      .eq('id', validated.id);

    if (updateError) {
      return { success: false, error: 'Failed to update role' };
    }

    // Audit log
    await supabaseAdmin.from('role_audit_log').insert({
      role_id: validated.id,
      action: 'updated',
      changed_by: userId,
      changes: updates,
    });

    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'role.update',
      resource_type: 'roles',
      resource_id: validated.id.toString(),
      metadata: updates,
    });

    revalidatePath('/dashboard/roles');

    return { success: true };
  } catch (error) {
    console.error('Update role error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to update role' };
  }
}

// =====================================================
// MANAGE ROLE PERMISSIONS
// =====================================================

export async function updateRolePermissions(roleId: number, permissionIds: number[]) {
  try {
    const session = await requirePermission('roles.update');
    const userId = session.user.id;

    // Check if role is system
    const { data: role } = await supabaseAdmin
      .from('roles')
      .select('is_system, name')
      .eq('id', roleId)
      .single();

    if (!role) {
      return { success: false, error: 'Role not found' };
    }

    if (role.is_system) {
      return { success: false, error: 'Cannot modify system role permissions' };
    }

    // Get current permissions
    const { data: currentPerms } = await supabaseAdmin
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', roleId);

    const currentPermIds = (currentPerms || []).map((p) => p.permission_id);

    // Calculate changes
    const added = permissionIds.filter((id) => !currentPermIds.includes(id));
    const removed = currentPermIds.filter((id) => !permissionIds.includes(id));

    // Remove old permissions
    await supabaseAdmin.from('role_permissions').delete().eq('role_id', roleId);

    // Add new permissions
    if (permissionIds.length > 0) {
      const mappings = permissionIds.map((permId) => ({
        role_id: roleId,
        permission_id: permId,
      }));

      const { error } = await supabaseAdmin.from('role_permissions').insert(mappings);

      if (error) {
        return { success: false, error: 'Failed to update permissions' };
      }
    }

    // Audit log
    await supabaseAdmin.from('role_audit_log').insert({
      role_id: roleId,
      action: 'permissions_updated',
      changed_by: userId,
      changes: {
        added_count: added.length,
        removed_count: removed.length,
        total_permissions: permissionIds.length,
      },
    });

    revalidatePath('/dashboard/roles');

    return { success: true };
  } catch (error) {
    console.error('Update permissions error:', error);
    return { success: false, error: 'Failed to update permissions' };
  }
}

// =====================================================
// CLONE ROLE
// =====================================================

export async function cloneCustomRole(data: z.infer<typeof cloneRoleSchema>) {
  try {
    const session = await requirePermission('roles.create');
    const userId = session.user.id;

    const validated = cloneRoleSchema.parse(data);

    const { data: roleId, error } = await supabaseAdmin.rpc('clone_role', {
      p_source_role_id: validated.sourceRoleId,
      p_new_role_name: validated.newName,
      p_new_role_description: validated.newDescription || null,
      p_cloned_by: userId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'role.clone',
      resource_type: 'roles',
      resource_id: roleId.toString(),
      metadata: {
        source_role_id: validated.sourceRoleId,
        new_name: validated.newName,
      },
    });

    revalidatePath('/dashboard/roles');

    return { success: true, roleId };
  } catch (error) {
    console.error('Clone role error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to clone role' };
  }
}

// =====================================================
// DELETE ROLE
// =====================================================

export async function deleteCustomRole(roleId: number, reassignToRoleId?: number) {
  try {
    const session = await requirePermission('roles.delete');
    const userId = session.user.id;

    const { data: error } = await supabaseAdmin.rpc('delete_custom_role', {
      p_role_id: roleId,
      p_deleted_by: userId,
      p_reassign_to_role_id: reassignToRoleId || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'role.delete',
      resource_type: 'roles',
      resource_id: roleId.toString(),
      metadata: { reassign_to: reassignToRoleId },
    });

    revalidatePath('/dashboard/roles');

    return { success: true };
  } catch (error) {
    console.error('Delete role error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete role',
    };
  }
}

// =====================================================
// ASSIGN ROLE TO USER
// =====================================================

export async function assignRoleToUser(userId: string, roleId: number) {
  try {
    const session = await requirePermission('users.update');
    const adminId = session.user.id;

    // Check if user already has a role
    const { data: existing } = await supabaseAdmin
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Update existing
      await supabaseAdmin
        .from('user_roles')
        .update({ role_id: roleId })
        .eq('user_id', userId);
    } else {
      // Insert new
      await supabaseAdmin.from('user_roles').insert({
        user_id: userId,
        role_id: roleId,
      });
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'user.role_assigned',
      resource_type: 'users',
      resource_id: userId,
      metadata: { role_id: roleId, previous_role_id: existing?.role_id },
    });

    revalidatePath('/dashboard/admin/users');

    return { success: true };
  } catch (error) {
    console.error('Assign role error:', error);
    return { success: false, error: 'Failed to assign role' };
  }
}
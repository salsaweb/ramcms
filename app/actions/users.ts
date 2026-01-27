/**
 * User Management Server Actions
 * 
 * Admin-only actions for managing users and roles.
 */

'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createUserSchema, updateUserSchema, assignRoleSchema } from '@/lib/validations/schemas';
import { requirePermission } from '@/lib/rbac/guards';
import { PERMISSIONS, assignUserRole, revokeUserRole } from '@/lib/rbac/permissions';
import { hashPassword } from '@/lib/auth/password';
import { revalidatePath } from 'next/cache';

/**
 * Create a new user (Admin only)
 * 
 * Permission: users.create
 */
export async function createUser(formData: {
  name: string;
  email: string;
  password: string;
  roleId: number;
}) {
  try {
    const session = await requirePermission(PERMISSIONS.USERS_CREATE);
    const adminId = session.user.id;

    const validated = createUserSchema.safeParse(formData);
    
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0].message,
      };
    }

    const { name, email, password, roleId } = validated.data;

    // Check email uniqueness
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return {
        success: false,
        error: 'Email already registered',
      };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        email_verified: true, // Admin-created users are pre-verified
        is_active: true,
      })
      .select('id')
      .single();

    if (createError || !newUser) {
      return {
        success: false,
        error: 'Failed to create user',
      };
    }

    // Assign role
    await assignUserRole(newUser.id, roleId, adminId);

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'user.create',
      resource_type: 'users',
      resource_id: newUser.id,
      metadata: { email, role_id: roleId },
    });

    revalidatePath('/dashboard/users');

    return {
      success: true,
      userId: newUser.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
}

/**
 * Update user information
 * 
 * Permission: users.update
 */
export async function updateUser(formData: {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  isActive?: boolean;
}) {
  try {
    const session = await requirePermission(PERMISSIONS.USERS_UPDATE);
    const adminId = session.user.id;

    const validated = updateUserSchema.safeParse(formData);
    
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0].message,
      };
    }

    const { id, ...updates } = validated.data;

    // Prevent self-deactivation
    if (updates.isActive === false && id === adminId) {
      return {
        success: false,
        error: 'Cannot deactivate your own account',
      };
    }

    const cleanUpdates: any = {};
    if (updates.name) cleanUpdates.name = updates.name;
    if (updates.email) cleanUpdates.email = updates.email.toLowerCase();
    if (updates.avatarUrl !== undefined) cleanUpdates.avatar_url = updates.avatarUrl || null;
    if (updates.isActive !== undefined) cleanUpdates.is_active = updates.isActive;

    const { error } = await supabaseAdmin
      .from('users')
      .update(cleanUpdates)
      .eq('id', id);

    if (error) {
      return {
        success: false,
        error: 'Failed to update user',
      };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'user.update',
      resource_type: 'users',
      resource_id: id,
      metadata: cleanUpdates,
    });

    revalidatePath('/dashboard/users');

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
    };
  }
}

/**
 * Delete a user
 * 
 * Permission: users.delete
 */
export async function deleteUser(userId: string) {
  try {
    const session = await requirePermission(PERMISSIONS.USERS_DELETE);
    const adminId = session.user.id;

    // Prevent self-deletion
    if (userId === adminId) {
      return {
        success: false,
        error: 'Cannot delete your own account',
      };
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      return {
        success: false,
        error: 'Failed to delete user',
      };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'user.delete',
      resource_type: 'users',
      resource_id: userId,
    });

    revalidatePath('/dashboard/users');

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    };
  }
}

/**
 * Assign role to user
 * 
 * Permission: users.manage_roles
 */
export async function assignRole(formData: {
  userId: string;
  roleId: number;
}) {
  try {
    const session = await requirePermission(PERMISSIONS.USERS_MANAGE_ROLES);
    const adminId = session.user.id;

    const validated = assignRoleSchema.safeParse(formData);
    
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0].message,
      };
    }

    const { userId, roleId } = validated.data;

    const result = await assignUserRole(userId, roleId, adminId);

    if (!result.success) {
      return result;
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'user.role_assign',
      resource_type: 'users',
      resource_id: userId,
      metadata: { role_id: roleId },
    });

    revalidatePath('/dashboard/users');

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign role',
    };
  }
}

/**
 * Revoke role from user
 * 
 * Permission: users.manage_roles
 */
export async function removeRole(formData: {
  userId: string;
  roleId: number;
}) {
  try {
    const session = await requirePermission(PERMISSIONS.USERS_MANAGE_ROLES);
    const adminId = session.user.id;

    const validated = assignRoleSchema.safeParse(formData);
    
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0].message,
      };
    }

    const { userId, roleId } = validated.data;

    const result = await revokeUserRole(userId, roleId);

    if (!result.success) {
      return result;
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'user.role_revoke',
      resource_type: 'users',
      resource_id: userId,
      metadata: { role_id: roleId },
    });

    revalidatePath('/dashboard/users');

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke role',
    };
  }
}

/**
 * Get all users (for admin panel)
 * 
 * Permission: users.read
 */
export async function getUsers() {
  try {
    await requirePermission(PERMISSIONS.USERS_READ);

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        avatar_url,
        is_active,
        email_verified,
        created_at,
        last_login_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: 'Failed to fetch users',
      };
    }

    return {
      success: true,
      users: users || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    };
  }
}
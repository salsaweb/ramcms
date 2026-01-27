/**
 * Auth Server Actions
 * 
 * Registration and password management actions.
 * All inputs are validated with Zod before processing.
 */

'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { registerSchema, changePasswordSchema } from '@/lib/validations/schemas';
import { requireAuth } from '@/lib/rbac/guards';
import { assignUserRole } from '@/lib/rbac/permissions';

/**
 * Register a new user
 * 
 * Process:
 * 1. Validate input
 * 2. Check email uniqueness
 * 3. Hash password
 * 4. Create user
 * 5. Assign default role (author)
 * 
 * @returns { success: boolean; error?: string }
 */
export async function registerUser(formData: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  try {
    // Validate input
    const validated = registerSchema.safeParse(formData);
    
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0].message,
      };
    }

    const { name, email, password } = validated.data;

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
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
        email_verified: false,
        is_active: true,
      })
      .select('id')
      .single();

    if (createError || !newUser) {
      console.error('User creation failed:', createError);
      return {
        success: false,
        error: 'Failed to create account',
      };
    }

    // Assign default role (author - role_id: 3)
    const { data: authorRole } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'author')
      .single();

    if (authorRole) {
      await assignUserRole(newUser.id, authorRole.id, newUser.id);
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: newUser.id,
      action: 'user.register',
      resource_type: 'users',
      resource_id: newUser.id,
      metadata: { email },
    });

    return {
      success: true,
      userId: newUser.id,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Registration failed',
    };
  }
}

/**
 * Change user password
 * 
 * @returns { success: boolean; error?: string }
 */
export async function changePassword(formData: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    // Require authentication
    const session = await requireAuth();
    const userId = session.user.id;

    // Validate input
    const validated = changePasswordSchema.safeParse(formData);
    
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0].message,
      };
    }

    const { currentPassword, newPassword } = validated.data;

    // Fetch current password hash
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
    
    if (!isValidPassword) {
      return {
        success: false,
        error: 'Current password is incorrect',
      };
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', userId);

    if (updateError) {
      console.error('Password update failed:', updateError);
      return {
        success: false,
        error: 'Failed to update password',
      };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'user.password_change',
      resource_type: 'users',
      resource_id: userId,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Password change error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change password',
    };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(formData: {
  name?: string;
  avatarUrl?: string;
}) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const updates: any = {};
    if (formData.name) updates.name = formData.name.trim();
    if (formData.avatarUrl !== undefined) updates.avatar_url = formData.avatarUrl || null;

    const { error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      return {
        success: false,
        error: 'Failed to update profile',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}
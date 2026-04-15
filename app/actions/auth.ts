/**
 * Auth Server Actions
 * 
 * Registration and password management actions.
 * All inputs are validated with Zod before processing.
 */

'use server';

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { registerSchema, changePasswordSchema, resetPasswordSchema } from '@/lib/validations/schemas';
import { requireAuth } from '@/lib/rbac/guards';
import { assignUserRole } from '@/lib/rbac/permissions';
import { sendResetEmail } from '@/lib/email/send-reset-email';

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
 * Request a password reset
 *
 * @returns { success: boolean; error?: string }
 */
export async function forgotPassword(email: string) {
  try {
    if (!email) {
      return {
        success: false,
        error: 'Email is required',
      };
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('email, id')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: userError ? 'Failed to look up email' : 'Email not found',
      };
    }

    const token = await createPasswordResetToken(user.id);

    console.log('Sending password reset email to:', user.email, token);

    await sendResetEmail(user.email, token);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    return {
      success: false,
      error: 'Failed to process password reset',
    };
  }
}

/** Reset user password
 * 
 * @returns { success: boolean; error?: string }
 */
export async function resetPassword(formData: {
  newPassword: string;
  confirmPassword: string;
}, token: string) {
  try {
    if (!token) {
      return {
        success: false,
        error: 'Invalid or missing token',
      };
    }

    // Validate input
    const validated = resetPasswordSchema.safeParse(formData);
    
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0].message,
      };
    }

    const { newPassword } = validated.data;

    // Hash token for lookup
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find token in DB
    const { data: tokenRecord, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('user_id, expires_at')
      .eq('token', hashedToken)
      .single();

    if (tokenError || !tokenRecord) {
      return {
        success: false,
        error: 'Invalid or expired token',
      };
    }

    //  Check token expiry  
    const now = new Date();
    if (tokenRecord.expires_at < now) {
      return {
        success: false,
        error: 'Invalid or expired token',
      };
    }
    const userId = tokenRecord.user_id;

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update user's password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', userId);

    if (updateError) {
      console.error('Password reset failed:', updateError);
      return {
        success: false,
        error: 'Failed to reset password',
      };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'user.password_reset',
      resource_type: 'users',
      resource_id: userId,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      error: 'Failed to reset password',
    };
  } finally {
    // Always delete token after attempt to prevent reuse
    if (token) {
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      await supabaseAdmin
        .from('password_reset_tokens')
        .delete()
        .eq('token', hashedToken);
    }
  }
}


/**
 * Create a password reset / invite token for a user.
 *
 * @param userId  - User UUID
 * @param ttlMs   - Token TTL in milliseconds (default: 1 hour)
 * @returns Raw token string to embed in the email link (never stored)
 */
export async function createPasswordResetToken(
  userId: string,
  ttlMs: number = 1000 * 60 * 60 // 1 hour default
) {
  // 1. Generate raw token (sent via email)
  const rawToken = crypto.randomBytes(32).toString('hex');

  // 2. Hash token (stored in DB)
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const expiresAt = new Date(Date.now() + ttlMs);

  // 3. Delete existing tokens for this user (prevent stale tokens)
  await supabaseAdmin
    .from('password_reset_tokens')
    .delete()
    .eq('user_id', userId);

  // 4. Store new hashed token
  await supabaseAdmin.from('password_reset_tokens').insert({
    user_id: userId,
    token: hashedToken,
    expires_at: expiresAt.toISOString(),
  });

  // 5. Return RAW token (never hashed — embedded in email link)
  return rawToken;
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
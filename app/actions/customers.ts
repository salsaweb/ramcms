'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { PERMISSIONS, assignUserRole } from '@/lib/rbac/permissions';
import { hashPassword } from '@/lib/auth/password';
import { getSettingByKey } from '@/app/actions/settings';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  twitterHandle: z.string().optional(),
  facebookUrl: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
  instagram: z.string().optional(),
  youtube: z.string().url('Invalid YouTube URL').optional().or(z.literal('')),
  createAccount: z.boolean().default(false),
});

const updateCustomerSchema = z.object({
  id: z.string().uuid('Invalid customer ID'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  twitterHandle: z.string().optional(),
  facebookUrl: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
  instagram: z.string().optional(),
  youtube: z.string().url('Invalid YouTube URL').optional().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// getCustomers — admin fetches all contacts typed as 'customer'
// ---------------------------------------------------------------------------

export async function getCustomers() {
  try {
    await requirePermission(PERMISSIONS.CUSTOMERS_READ);

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select('*, users!contacts_user_id_fkey(id, email, is_active)')
      .eq('contact_type', 'customer')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getCustomers error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getCustomers exception:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// getCustomerById
// ---------------------------------------------------------------------------

export async function getCustomerById(id: string) {
  try {
    await requirePermission(PERMISSIONS.CUSTOMERS_READ);

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select('*, users!contacts_user_id_fkey(id, email, is_active, name)')
      .eq('id', id)
      .eq('contact_type', 'customer')
      .single();

    if (error) {
      console.error('getCustomerById error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('getCustomerById exception:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// createCustomer
// ---------------------------------------------------------------------------

export async function createCustomer(formData: FormData) {
  try {
    const session = await requirePermission(PERMISSIONS.CUSTOMERS_CREATE);
    const ownerId = session.user.id;

    const inputData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: (formData.get('email') as string) || '',
      phone: (formData.get('phone') as string) || '',
      notes: (formData.get('notes') as string) || '',
      tags: (formData.get('tags') as string) || '',
      linkedinUrl: (formData.get('linkedinUrl') as string) || '',
      twitterHandle: (formData.get('twitterHandle') as string) || '',
      facebookUrl: (formData.get('facebookUrl') as string) || '',
      instagram: (formData.get('instagram') as string) || '',
      youtube: (formData.get('youtube') as string) || '',
      createAccount: formData.get('createAccount') === 'true',
    };

    const validated = createCustomerSchema.safeParse(inputData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message || 'Validation failed' };
    }

    const input = validated.data;
    let newUserId: string | null = null;

    // Optionally create a user account so the customer can log in
    if (input.createAccount && input.email) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', input.email)
        .single();

      if (existingUser) {
        newUserId = existingUser.id;
      } else {
        const temporaryPassword = crypto.randomBytes(12).toString('hex');
        const hashedPassword = await hashPassword(temporaryPassword);

        const { data: newUser, error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            email: input.email,
            password_hash: hashedPassword,
            name: `${input.firstName} ${input.lastName}`.trim(),
            is_active: true,
          })
          .select()
          .single();

        if (userError || !newUser) {
          console.error('Failed to create user account:', userError);
          return { success: false, error: 'Failed to create user account' };
        }

        newUserId = newUser.id;

        // Assign default customer role if configured
        const defaultRoleIdStr = await getSettingByKey('default_customer_role_id');
        if (defaultRoleIdStr) {
          const roleId = parseInt(defaultRoleIdStr, 10);
          if (!isNaN(roleId)) {
            await assignUserRole(newUserId!, roleId, ownerId);
          }
        }

        console.log(`[INVITE SYSTEM] Customer account created for ${input.email}`);
      }
    }

    const tagsArray = input.tags
      ? input.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const { data: contact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .insert({
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email || null,
        phone: input.phone || null,
        owner_id: ownerId,
        user_id: newUserId,
        contact_type: 'customer',
        tags: tagsArray,
        linkedin_url: input.linkedinUrl || null,
        twitter_handle: input.twitterHandle || null,
        facebook_url: input.facebookUrl || null,
        custom_fields: {
          ...(input.notes ? { notes: input.notes } : {}),
          ...(input.instagram ? { instagram: input.instagram } : {}),
          ...(input.youtube ? { youtube: input.youtube } : {}),
        },
      })
      .select()
      .single();

    if (contactError) {
      console.error('Failed to create customer contact:', contactError);
      return { success: false, error: contactError.message };
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: ownerId,
      action: 'customers.create',
      resource_type: 'contacts',
      resource_id: contact.id,
      metadata: { created_account: input.createAccount },
    });

    revalidatePath('/dashboard/customers');
    return { success: true, customerId: contact.id };
  } catch (error) {
    console.error('createCustomer exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

// ---------------------------------------------------------------------------
// createCustomerFromOrder — creates a minimal customer contact record
// ---------------------------------------------------------------------------

export async function createCustomerFromOrder(data: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  ownerId: string;
}): Promise<{ success: boolean; customerId?: string; error?: string }> {
  try {
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        owner_id: data.ownerId,
        contact_type: 'customer',
        custom_fields: {},
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/customers');
    return { success: true, customerId: contact.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

// ---------------------------------------------------------------------------
// updateCustomer
// ---------------------------------------------------------------------------

export async function updateCustomer(formData: FormData) {
  try {
    const session = await requirePermission(PERMISSIONS.CUSTOMERS_UPDATE);
    const ownerId = session.user.id;

    const inputData = {
      id: formData.get('id') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: (formData.get('email') as string) || '',
      phone: (formData.get('phone') as string) || '',
      notes: (formData.get('notes') as string) || '',
      tags: (formData.get('tags') as string) || '',
      linkedinUrl: (formData.get('linkedinUrl') as string) || '',
      twitterHandle: (formData.get('twitterHandle') as string) || '',
      facebookUrl: (formData.get('facebookUrl') as string) || '',
      instagram: (formData.get('instagram') as string) || '',
      youtube: (formData.get('youtube') as string) || '',
    };

    const validated = updateCustomerSchema.safeParse(inputData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message || 'Validation failed' };
    }

    const input = validated.data;
    const tagsArray = input.tags
      ? input.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const { error: updateError } = await supabaseAdmin
      .from('contacts')
      .update({
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email || null,
        phone: input.phone || null,
        tags: tagsArray,
        linkedin_url: input.linkedinUrl || null,
        twitter_handle: input.twitterHandle || null,
        facebook_url: input.facebookUrl || null,
        custom_fields: {
          ...(input.notes ? { notes: input.notes } : {}),
          ...(input.instagram ? { instagram: input.instagram } : {}),
          ...(input.youtube ? { youtube: input.youtube } : {}),
        },
      })
      .eq('id', input.id)
      .eq('contact_type', 'customer');

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: ownerId,
      action: 'customers.update',
      resource_type: 'contacts',
      resource_id: input.id,
    });

    revalidatePath('/dashboard/customers');
    revalidatePath(`/dashboard/customers/${input.id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

// ---------------------------------------------------------------------------
// deleteCustomer
// ---------------------------------------------------------------------------

export async function deleteCustomer(id: string) {
  try {
    const session = await requirePermission(PERMISSIONS.CUSTOMERS_DELETE);

    const { error } = await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('contact_type', 'customer');

    if (error) {
      return { success: false, error: error.message };
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'customers.delete',
      resource_type: 'contacts',
      resource_id: id,
    });

    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

// ---------------------------------------------------------------------------
// linkCustomerUser — attach an existing user account to a customer contact
// ---------------------------------------------------------------------------

export async function linkCustomerUser(customerId: string, userId: string) {
  try {
    await requirePermission(PERMISSIONS.CUSTOMERS_UPDATE);

    const { error } = await supabaseAdmin
      .from('contacts')
      .update({ user_id: userId })
      .eq('id', customerId)
      .eq('contact_type', 'customer');

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/customers/${customerId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

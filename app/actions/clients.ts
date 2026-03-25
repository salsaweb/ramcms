'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { PERMISSIONS, assignUserRole } from '@/lib/rbac/permissions';
import { hashPassword } from '@/lib/auth/password';
import { getSettingByKey } from '@/app/actions/settings';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import crypto from 'crypto';

const createClientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(), // We'll split by comma
  createAccount: z.boolean().default(false),
});

const updateClientSchema = z.object({
  id: z.string().uuid('Invalid client ID'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

/**
 * Creates a new client (contact in CRM) and optionally creates a user account (participant)
 */
export async function createClient(formData: FormData) {
  try {
    const session = await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);
    const ownerId = session.user.id;

    const inputData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      notes: formData.get('notes') as string,
      tags: formData.get('tags') as string,
      createAccount: formData.get('createAccount') === 'true',
    };

    const validated = createClientSchema.safeParse(inputData);

    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message || 'Validation failed' };
    }

    const input = validated.data;
    let newUserId: string | null = null;

    // Optional: Create a User Account for this client
    if (input.createAccount && input.email) {
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', input.email)
        .single();

      if (existingUser) {
        newUserId = existingUser.id;
      } else {
        // Create new user
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
          console.error('Failed to create user:', userError);
          return { success: false, error: 'Failed to create user account' };
        }

        newUserId = newUser.id;

        // Assign default participant role if configured
        let participantRoleId: number | null = null;
        const defaultRoleIdStr = await getSettingByKey('default_participant_role_id');
        
        if (defaultRoleIdStr) {
          participantRoleId = parseInt(defaultRoleIdStr, 10);
        }

        if (participantRoleId && newUserId) {
          await assignUserRole(newUserId, participantRoleId, ownerId);
        }

        // Simulate sending welcome invite
        console.log(`[INVITE SYSTEM] Sent welcome invite to ${input.email} for their new Participant account.`);
      }
    }

    // Prepare tags array
    const tagsArray = input.tags 
      ? input.tags.split(',').map(t => t.trim()).filter(Boolean) 
      : [];

    // Create the contact bound to the current user (Practitioner)
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
        custom_fields: input.notes ? { notes: input.notes } : {},
      })
      .select()
      .single();

    if (contactError) {
      console.error('Failed to create contact:', contactError);
      return { success: false, error: contactError.message };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: ownerId,
      action: 'clients.create',
      resource_type: 'contacts',
      resource_id: contact.id,
      metadata: { created_account: input.createAccount }
    });

    revalidatePath('/dashboard/clients');
    return { success: true, clientId: contact.id };
  } catch (error) {
    console.error('Exception in createClient:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
  }
}

/**
 * Fetch all clients belonging to the practitioner
 */
export async function getClients() {
  try {
    const session = await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);
    const ownerId = session.user.id;

    const { data: clients, error } = await supabaseAdmin
      .from('contacts')
      .select('*, users!contacts_user_id_fkey(id, email, is_active)')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch clients:', error);
      return [];
    }

    return clients || [];
  } catch (error) {
    console.error('Exception fetching clients:', error);
    return [];
  }
}

/**
 * Fetch a specific client by ID
 */
export async function getClientById(id: string) {
  try {
    const session = await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);
    const ownerId = session.user.id;

    const { data: client, error } = await supabaseAdmin
      .from('contacts')
      .select('*, users!contacts_user_id_fkey(id, email, is_active)')
      .eq('id', id)
      .eq('owner_id', ownerId)
      .single();

    if (error) {
      console.error('Failed to fetch client:', error);
      return null;
    }

    return client;
  } catch (error) {
    console.error('Exception fetching client:', error);
    return null;
  }
}

/**
 * Update an existing client
 */
export async function updateClient(formData: FormData) {
  try {
    const session = await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);
    const ownerId = session.user.id;

    const inputData = {
      id: formData.get('id') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      notes: formData.get('notes') as string,
      tags: formData.get('tags') as string,
    };

    const validated = updateClientSchema.safeParse(inputData);

    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message || 'Validation failed' };
    }

    const input = validated.data;
    const tagsArray = input.tags ? input.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Verify ownership
    const { data: existingClient } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('id', input.id)
      .eq('owner_id', ownerId)
      .single();

    if (!existingClient) {
      return { success: false, error: 'Client not found or access denied' };
    }

    const { error: updateError } = await supabaseAdmin
      .from('contacts')
      .update({
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email || null,
        phone: input.phone || null,
        tags: tagsArray,
        custom_fields: input.notes ? { notes: input.notes } : {},
      })
      .eq('id', input.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: ownerId,
      action: 'clients.update',
      resource_type: 'contacts',
      resource_id: input.id,
    });

    revalidatePath('/dashboard/clients');
    revalidatePath(`/dashboard/clients/${input.id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
  }
}

/**
 * Delete a client
 */
export async function deleteClient(id: string) {
  try {
    const session = await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);
    const ownerId = session.user.id;

    const { error } = await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: ownerId,
      action: 'clients.delete',
      resource_type: 'contacts',
      resource_id: id,
    });

    revalidatePath('/dashboard/clients');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
  }
}

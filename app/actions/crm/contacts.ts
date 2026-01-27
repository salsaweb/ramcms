/**
 * CRM Contacts Server Actions
 * 
 * Full CRUD operations with RBAC enforcement
 */

'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission, requireAuth } from '@/lib/rbac/guards';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  mobile: z.string().max(50).optional().or(z.literal('')),
  jobTitle: z.string().max(100).optional().or(z.literal('')),
  companyId: z.string().uuid().optional().or(z.literal('')),
  contactType: z.enum(['lead', 'customer', 'partner', 'vendor']).default('lead'),
  leadStatus: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'lost']).default('new'),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
});

const updateContactSchema = createContactSchema.partial().extend({
  id: z.string().uuid(),
});

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Create a new contact
 */
export async function createContact(data: z.infer<typeof createContactSchema>) {
  try {
    const session = await requirePermission('contacts.create');
    const userId = session.user.id;

    const validated = createContactSchema.parse(data);

    // Check if email already exists
    if (validated.email) {
      const { data: existing } = await supabaseAdmin
        .from('contacts')
        .select('id')
        .eq('email', validated.email)
        .single();

      if (existing) {
        return { success: false, error: 'Contact with this email already exists' };
      }
    }

    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .insert({
        first_name: validated.firstName,
        last_name: validated.lastName,
        email: validated.email || null,
        phone: validated.phone || null,
        mobile: validated.mobile || null,
        job_title: validated.jobTitle || null,
        company_id: validated.companyId || null,
        contact_type: validated.contactType,
        lead_status: validated.leadStatus,
        city: validated.city || null,
        state: validated.state || null,
        country: validated.country || null,
        tags: validated.tags || [],
        owner_id: userId,
        assigned_to: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Create contact error:', error);
      return { success: false, error: 'Failed to create contact' };
    }

    // Log activity
    await supabaseAdmin.from('activities').insert({
      activity_type: 'note',
      subject: 'Contact created',
      description: `${validated.firstName} ${validated.lastName} was added to the CRM`,
      contact_id: contact.id,
      created_by: userId,
    });

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'contact.create',
      resource_type: 'contacts',
      resource_id: contact.id,
      metadata: { email: validated.email, name: `${validated.firstName} ${validated.lastName}` },
    });

    revalidatePath('/dashboard/crm/contacts');

    return { success: true, contact };
  } catch (error) {
    console.error('Create contact error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to create contact' };
  }
}

/**
 * Update contact
 */
export async function updateContact(data: z.infer<typeof updateContactSchema>) {
  try {
    const session = await requirePermission('contacts.update');
    const userId = session.user.id;

    const validated = updateContactSchema.parse(data);
    const { id, ...updates } = validated;

    // Check if contact exists
    const { data: existing } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return { success: false, error: 'Contact not found' };
    }

    const cleanUpdates: any = {};
    if (updates.firstName) cleanUpdates.first_name = updates.firstName;
    if (updates.lastName) cleanUpdates.last_name = updates.lastName;
    if (updates.email !== undefined) cleanUpdates.email = updates.email || null;
    if (updates.phone !== undefined) cleanUpdates.phone = updates.phone || null;
    if (updates.mobile !== undefined) cleanUpdates.mobile = updates.mobile || null;
    if (updates.jobTitle !== undefined) cleanUpdates.job_title = updates.jobTitle || null;
    if (updates.companyId !== undefined) cleanUpdates.company_id = updates.companyId || null;
    if (updates.contactType) cleanUpdates.contact_type = updates.contactType;
    if (updates.leadStatus) cleanUpdates.lead_status = updates.leadStatus;
    if (updates.city !== undefined) cleanUpdates.city = updates.city || null;
    if (updates.state !== undefined) cleanUpdates.state = updates.state || null;
    if (updates.country !== undefined) cleanUpdates.country = updates.country || null;
    if (updates.tags !== undefined) cleanUpdates.tags = updates.tags;

    const { error } = await supabaseAdmin
      .from('contacts')
      .update(cleanUpdates)
      .eq('id', id);

    if (error) {
      console.error('Update contact error:', error);
      return { success: false, error: 'Failed to update contact' };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'contact.update',
      resource_type: 'contacts',
      resource_id: id,
      metadata: cleanUpdates,
    });

    revalidatePath('/dashboard/crm/contacts');
    revalidatePath(`/dashboard/crm/contacts/${id}`);

    return { success: true };
  } catch (error) {
    console.error('Update contact error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to update contact' };
  }
}

/**
 * Delete contact
 */
export async function deleteContact(contactId: string) {
  try {
    const session = await requirePermission('contacts.delete');
    const userId = session.user.id;

    const { error } = await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (error) {
      return { success: false, error: 'Failed to delete contact' };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'contact.delete',
      resource_type: 'contacts',
      resource_id: contactId,
    });

    revalidatePath('/dashboard/crm/contacts');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete contact',
    };
  }
}

/**
 * Get all contacts (with filters)
 */
export async function getContacts(filters?: {
  contactType?: string;
  leadStatus?: string;
  companyId?: string;
  search?: string;
  limit?: number;
}) {
  try {
    await requirePermission('contacts.read');

    let query = supabaseAdmin
      .from('contacts')
      .select(`
        *,
        companies(name),
        owner:users!contacts_owner_id_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.contactType) {
      query = query.eq('contact_type', filters.contactType);
    }

    if (filters?.leadStatus) {
      query = query.eq('lead_status', filters.leadStatus);
    }

    if (filters?.companyId) {
      query = query.eq('company_id', filters.companyId);
    }

    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(100);
    }

    const { data: contacts, error } = await query;

    if (error) {
      console.error('Get contacts error:', error);
      return { success: false, error: 'Failed to fetch contacts' };
    }

    return { success: true, contacts: contacts || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contacts',
    };
  }
}

/**
 * Get single contact with full details
 */
export async function getContact(contactId: string) {
  try {
    await requirePermission('contacts.read');

    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .select(`
        *,
        companies(id, name, industry),
        owner:users!contacts_owner_id_fkey(id, name, email),
        assigned:users!contacts_assigned_to_fkey(id, name, email)
      `)
      .eq('id', contactId)
      .single();

    if (error || !contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Get activities
    const { data: activities } = await supabaseAdmin
      .from('activities')
      .select(`
        *,
        creator:users!activities_created_by_fkey(name)
      `)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get deals
    const { data: deals } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('contact_id', contactId);

    // Get tasks
    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('contact_id', contactId)
      .neq('status', 'completed')
      .order('due_date', { ascending: true });

    return {
      success: true,
      contact,
      activities: activities || [],
      deals: deals || [],
      tasks: tasks || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contact',
    };
  }
}

/**
 * Add note/activity to contact
 */
export async function addContactActivity(
  contactId: string,
  data: {
    type: 'note' | 'email' | 'call' | 'meeting';
    subject: string;
    description: string;
  }
) {
  try {
    const session = await requirePermission('activities.create');
    const userId = session.user.id;

    const { error } = await supabaseAdmin.from('activities').insert({
      activity_type: data.type,
      subject: data.subject,
      description: data.description,
      contact_id: contactId,
      created_by: userId,
    });

    if (error) {
      return { success: false, error: 'Failed to add activity' };
    }

    // Update last contacted
    await supabaseAdmin
      .from('contacts')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', contactId);

    revalidatePath(`/dashboard/crm/contacts/${contactId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add activity',
    };
  }
}
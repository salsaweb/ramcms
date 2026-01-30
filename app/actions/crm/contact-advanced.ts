/**
 * Advanced Contact Actions
 * 
 * Duplicate detection, merge, ownership transfer, call logging, reminders
 */

'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// =====================================================
// DUPLICATE DETECTION
// =====================================================

export async function detectDuplicates() {
  try {
    await requirePermission('contacts.read');

    const { data: duplicates, error } = await supabaseAdmin
      .rpc('detect_duplicate_contacts');

    if (error) {
      console.error('Detect duplicates error:', error);
      return { success: false, error: 'Failed to detect duplicates' };
    }

    // Store detected duplicates
    if (duplicates && duplicates.length > 0) {
      const duplicateRecords = duplicates
        .filter((d: any) => d.similarity_score >= 50) // Only store high-confidence matches
        .map((d: any) => ({
          contact_id_1: d.contact1_id,
          contact_id_2: d.contact2_id,
          similarity_score: d.similarity_score,
          matched_fields: d.matched_fields,
        }));

      if (duplicateRecords.length > 0) {
        await supabaseAdmin
          .from('contact_duplicates')
          .upsert(duplicateRecords, {
            onConflict: 'contact_id_1,contact_id_2',
            ignoreDuplicates: false,
          });
      }
    }

    return { success: true, duplicates: duplicates || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to detect duplicates',
    };
  }
}

export async function getPendingDuplicates() {
  try {
    await requirePermission('contacts.read');

    const { data: duplicates, error } = await supabaseAdmin
      .from('contact_duplicates')
      .select(`
        *,
        contact1:contacts!contact_duplicates_contact_id_1_fkey(id, first_name, last_name, email, phone, company_id, companies(name)),
        contact2:contacts!contact_duplicates_contact_id_2_fkey(id, first_name, last_name, email, phone, company_id, companies(name))
      `)
      .eq('status', 'pending')
      .order('similarity_score', { ascending: false });

    if (error) {
      return { success: false, error: 'Failed to fetch duplicates' };
    }

    return { success: true, duplicates: duplicates || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch duplicates',
    };
  }
}

// =====================================================
// CONTACT MERGE
// =====================================================

const mergeContactsSchema = z.object({
  masterContactId: z.string().uuid(),
  mergeContactId: z.string().uuid(),
  keepMasterData: z.array(z.string()), // Fields to keep from master
});

export async function mergeContacts(data: z.infer<typeof mergeContactsSchema>) {
  try {
    const session = await requirePermission('contacts.update');
    const userId = session.user.id;

    const validated = mergeContactsSchema.parse(data);

    // Get both contacts
    const [master, merge] = await Promise.all([
      supabaseAdmin.from('contacts').select('*').eq('id', validated.masterContactId).single(),
      supabaseAdmin.from('contacts').select('*').eq('id', validated.mergeContactId).single(),
    ]);

    if (!master.data || !merge.data) {
      return { success: false, error: 'One or both contacts not found' };
    }

    // Merge custom_fields
    const mergedCustomFields = {
      ...(merge.data.custom_fields || {}),
      ...(master.data.custom_fields || {}),
    };

    // Merge tags
    const masterTags = master.data.tags || [];
    const mergeTags = merge.data.tags || [];
    const mergedTags = [...new Set([...masterTags, ...mergeTags])];

    // Update master contact with merged data
    const updates: any = {
      custom_fields: mergedCustomFields,
      tags: mergedTags,
    };

    // If merge contact has data that master doesn't, use it
    if (!master.data.phone && merge.data.phone) updates.phone = merge.data.phone;
    if (!master.data.mobile && merge.data.mobile) updates.mobile = merge.data.mobile;
    if (!master.data.email && merge.data.email) updates.email = merge.data.email;
    if (!master.data.job_title && merge.data.job_title) updates.job_title = merge.data.job_title;
    if (!master.data.company_id && merge.data.company_id) updates.company_id = merge.data.company_id;

    await supabaseAdmin
      .from('contacts')
      .update(updates)
      .eq('id', validated.masterContactId);

    // Reassign all related records to master contact
    await Promise.all([
      // Deals
      supabaseAdmin
        .from('deals')
        .update({ contact_id: validated.masterContactId })
        .eq('contact_id', validated.mergeContactId),
      
      // Tasks
      supabaseAdmin
        .from('tasks')
        .update({ contact_id: validated.masterContactId })
        .eq('contact_id', validated.mergeContactId),
      
      // Activities
      supabaseAdmin
        .from('activities')
        .update({ contact_id: validated.masterContactId })
        .eq('contact_id', validated.mergeContactId),
      
      // Call logs
      supabaseAdmin
        .from('call_logs')
        .update({ contact_id: validated.masterContactId })
        .eq('contact_id', validated.mergeContactId),
      
      // Reminders
      supabaseAdmin
        .from('activity_reminders')
        .update({ contact_id: validated.masterContactId })
        .eq('contact_id', validated.mergeContactId),
    ]);

    // Store merge history
    await supabaseAdmin.from('contact_merge_history').insert({
      master_contact_id: validated.masterContactId,
      merged_contact_id: validated.mergeContactId,
      merged_data: merge.data,
      merged_by: userId,
    });

    // Mark duplicate as merged
    await supabaseAdmin
      .from('contact_duplicates')
      .update({
        status: 'merged',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .or(`contact_id_1.eq.${validated.mergeContactId},contact_id_2.eq.${validated.mergeContactId}`);

    // Delete the merged contact
    await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('id', validated.mergeContactId);

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'contact.merge',
      resource_type: 'contacts',
      resource_id: validated.masterContactId,
      metadata: {
        merged_contact_id: validated.mergeContactId,
        master_name: `${master.data.first_name} ${master.data.last_name}`,
        merged_name: `${merge.data.first_name} ${merge.data.last_name}`,
      },
    });

    revalidatePath('/dashboard/crm/contacts');

    return { success: true };
  } catch (error) {
    console.error('Merge contacts error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to merge contacts' };
  }
}

export async function markDuplicateStatus(
  duplicateId: number,
  status: 'not_duplicate' | 'ignored'
) {
  try {
    const session = await requirePermission('contacts.update');
    const userId = session.user.id;

    await supabaseAdmin
      .from('contact_duplicates')
      .update({
        status,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', duplicateId);

    revalidatePath('/dashboard/crm/contacts/duplicates');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update duplicate status',
    };
  }
}

// =====================================================
// OWNERSHIP TRANSFER
// =====================================================

const transferOwnershipSchema = z.object({
  contactId: z.string().uuid(),
  toUserId: z.string().uuid(),
  reason: z.string().optional(),
});

export async function transferContactOwnership(
  data: z.infer<typeof transferOwnershipSchema>
) {
  try {
    const session = await requirePermission('contacts.update');
    const userId = session.user.id;

    const validated = transferOwnershipSchema.parse(data);

    const { error } = await supabaseAdmin.rpc('transfer_contact_ownership', {
      p_contact_id: validated.contactId,
      p_to_user_id: validated.toUserId,
      p_transferred_by: userId,
      p_reason: validated.reason || null,
    });

    if (error) {
      return { success: false, error: 'Failed to transfer ownership' };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'contact.ownership_transfer',
      resource_type: 'contacts',
      resource_id: validated.contactId,
      metadata: { to_user_id: validated.toUserId, reason: validated.reason },
    });

    revalidatePath('/dashboard/crm/contacts');
    revalidatePath(`/dashboard/crm/contacts/${validated.contactId}`);

    return { success: true };
  } catch (error) {
    console.error('Transfer ownership error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to transfer ownership' };
  }
}

export async function getOwnershipHistory(contactId: string) {
  try {
    await requirePermission('contacts.read');

    const { data, error } = await supabaseAdmin
      .from('contact_ownership_history')
      .select(`
        *,
        from_user:users!contact_ownership_history_from_user_id_fkey(name, email),
        to_user:users!contact_ownership_history_to_user_id_fkey(name, email),
        transferred_by_user:users!contact_ownership_history_transferred_by_fkey(name, email)
      `)
      .eq('contact_id', contactId)
      .order('transferred_at', { ascending: false });

    if (error) {
      return { success: false, error: 'Failed to fetch ownership history' };
    }

    return { success: true, history: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch ownership history',
    };
  }
}

// =====================================================
// CALL LOGGING
// =====================================================

const logCallSchema = z.object({
  contactId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  phoneNumber: z.string().min(1),
  direction: z.enum(['inbound', 'outbound']),
  outcome: z.enum(['answered', 'voicemail', 'no_answer', 'busy', 'failed']).optional(),
  durationSeconds: z.number().int().positive().optional(),
  notes: z.string().optional(),
  recordingUrl: z.string().url().optional().or(z.literal('')),
});

export async function logCall(data: z.infer<typeof logCallSchema>) {
  try {
    const session = await requirePermission('activities.create');
    const userId = session.user.id;

    const validated = logCallSchema.parse(data);

    const { data: callLog, error } = await supabaseAdmin
      .from('call_logs')
      .insert({
        contact_id: validated.contactId || null,
        company_id: validated.companyId || null,
        deal_id: validated.dealId || null,
        phone_number: validated.phoneNumber,
        direction: validated.direction,
        outcome: validated.outcome || null,
        duration_seconds: validated.durationSeconds || null,
        notes: validated.notes || null,
        recording_url: validated.recordingUrl || null,
        called_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Log call error:', error);
      return { success: false, error: 'Failed to log call' };
    }

    // Create activity entry
    if (validated.contactId || validated.companyId || validated.dealId) {
      const subject = `${validated.direction === 'inbound' ? 'Incoming' : 'Outgoing'} call - ${validated.outcome || 'completed'}`;
      const description = validated.notes || `Call ${validated.outcome || 'logged'} - ${validated.durationSeconds ? `${Math.floor(validated.durationSeconds / 60)}m ${validated.durationSeconds % 60}s` : 'duration not recorded'}`;

      await supabaseAdmin.from('activities').insert({
        activity_type: 'call',
        subject,
        description,
        contact_id: validated.contactId || null,
        company_id: validated.companyId || null,
        deal_id: validated.dealId || null,
        created_by: userId,
        metadata: {
          call_log_id: callLog.id,
          direction: validated.direction,
          outcome: validated.outcome,
          duration: validated.durationSeconds,
        },
      });
    }

    // Update contact last_contacted_at
    if (validated.contactId) {
      await supabaseAdmin
        .from('contacts')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', validated.contactId);
    }

    revalidatePath('/dashboard/crm/contacts');
    revalidatePath(`/dashboard/crm/contacts/${validated.contactId}`);

    return { success: true, callLog };
  } catch (error) {
    console.error('Log call error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to log call' };
  }
}

export async function getCallLogs(contactId?: string) {
  try {
    await requirePermission('activities.read');

    let query = supabaseAdmin
      .from('call_logs')
      .select(`
        *,
        contact:contacts(first_name, last_name),
        company:companies(name),
        deal:deals(name),
        caller:users!call_logs_called_by_fkey(name)
      `)
      .order('call_datetime', { ascending: false });

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      return { success: false, error: 'Failed to fetch call logs' };
    }

    return { success: true, calls: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch call logs',
    };
  }
}

// =====================================================
// ACTIVITY REMINDERS
// =====================================================

const createReminderSchema = z.object({
  contactId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  reminderType: z.enum(['follow_up', 'call', 'email', 'meeting', 'deadline', 'custom']),
  title: z.string().min(1),
  description: z.string().optional(),
  reminderDatetime: z.string(), // ISO datetime
  assignedTo: z.string().uuid().optional(),
});

export async function createReminder(data: z.infer<typeof createReminderSchema>) {
  try {
    const session = await requirePermission('activities.create');
    const userId = session.user.id;

    const validated = createReminderSchema.parse(data);

    const { data: reminder, error } = await supabaseAdmin
      .from('activity_reminders')
      .insert({
        contact_id: validated.contactId || null,
        company_id: validated.companyId || null,
        deal_id: validated.dealId || null,
        task_id: validated.taskId || null,
        reminder_type: validated.reminderType,
        reminder_title: validated.title,
        reminder_description: validated.description || null,
        reminder_datetime: validated.reminderDatetime,
        assigned_to: validated.assignedTo || userId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: 'Failed to create reminder' };
    }

    revalidatePath('/dashboard/crm/reminders');

    return { success: true, reminder };
  } catch (error) {
    console.error('Create reminder error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to create reminder' };
  }
}

export async function getUpcomingReminders(hoursAhead: number = 24) {
  try {
    const session = await requirePermission('activities.read');
    const userId = session.user.id;

    const { data, error } = await supabaseAdmin.rpc('get_upcoming_reminders', {
      p_user_id: userId,
      p_hours_ahead: hoursAhead,
    });

    if (error) {
      return { success: false, error: 'Failed to fetch reminders' };
    }

    return { success: true, reminders: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reminders',
    };
  }
}

export async function completeReminder(reminderId: string) {
  try {
    const session = await requirePermission('activities.update');

    const { error } = await supabaseAdmin
      .from('activity_reminders')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', reminderId);

    if (error) {
      return { success: false, error: 'Failed to complete reminder' };
    }

    revalidatePath('/dashboard/crm/reminders');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete reminder',
    };
  }
}

// =====================================================
// CUSTOM FIELDS MANAGEMENT
// =====================================================

export async function getCustomFields() {
  try {
    await requirePermission('contacts.read');

    const { data, error } = await supabaseAdmin
      .from('contact_custom_fields')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      return { success: false, error: 'Failed to fetch custom fields' };
    }

    return { success: true, customFields: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch custom fields',
    };
  }
}
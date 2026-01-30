/**
 * CRM Tasks Server Actions
 * 
 * Full CRUD operations for task management
 */

'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(255),
  description: z.string().optional(),
  taskType: z.enum(['call', 'email', 'meeting', 'deadline', 'follow_up', 'other']).default('other'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  contactId: z.string().uuid().optional().or(z.literal('')),
  companyId: z.string().uuid().optional().or(z.literal('')),
  dealId: z.string().uuid().optional().or(z.literal('')),
  assignedTo: z.string().uuid().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
});

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Create a new task
 */
export async function createTask(data: z.infer<typeof createTaskSchema>) {
  try {
    const session = await requirePermission('tasks.create');
    const userId = session.user.id;

    const validated = createTaskSchema.parse(data);

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        title: validated.title,
        description: validated.description || null,
        task_type: validated.taskType,
        priority: validated.priority,
        status: validated.status,
        contact_id: validated.contactId || null,
        company_id: validated.companyId || null,
        deal_id: validated.dealId || null,
        assigned_to: validated.assignedTo || userId,
        created_by: userId,
        due_date: validated.dueDate || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Create task error:', error);
      return { success: false, error: 'Failed to create task' };
    }

    // Log activity if linked to entities
    if (validated.contactId || validated.companyId || validated.dealId) {
      await supabaseAdmin.from('activities').insert({
        activity_type: 'other',
        subject: `Task created: ${validated.title}`,
        description: validated.description || `New ${validated.taskType} task created`,
        contact_id: validated.contactId || null,
        company_id: validated.companyId || null,
        deal_id: validated.dealId || null,
        task_id: task.id,
        created_by: userId,
      });
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'task.create',
      resource_type: 'tasks',
      resource_id: task.id,
      metadata: { title: validated.title },
    });

    revalidatePath('/dashboard/crm/tasks');

    return { success: true, task };
  } catch (error) {
    console.error('Create task error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to create task' };
  }
}

/**
 * Update task
 */
export async function updateTask(data: z.infer<typeof updateTaskSchema>) {
  try {
    const session = await requirePermission('tasks.update');
    const userId = session.user.id;

    const validated = updateTaskSchema.parse(data);
    const { id, ...updates } = validated;

    // Check if task exists
    const { data: existing } = await supabaseAdmin
      .from('tasks')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existing) {
      return { success: false, error: 'Task not found' };
    }

    const cleanUpdates: any = {};
    if (updates.title) cleanUpdates.title = updates.title;
    if (updates.description !== undefined) cleanUpdates.description = updates.description || null;
    if (updates.taskType) cleanUpdates.task_type = updates.taskType;
    if (updates.priority) cleanUpdates.priority = updates.priority;
    if (updates.status) cleanUpdates.status = updates.status;
    if (updates.contactId !== undefined) cleanUpdates.contact_id = updates.contactId || null;
    if (updates.companyId !== undefined) cleanUpdates.company_id = updates.companyId || null;
    if (updates.dealId !== undefined) cleanUpdates.deal_id = updates.dealId || null;
    if (updates.assignedTo !== undefined) cleanUpdates.assigned_to = updates.assignedTo || null;
    if (updates.dueDate !== undefined) cleanUpdates.due_date = updates.dueDate || null;

    // If marking as completed, set completed_at
    if (updates.status === 'completed' && existing.status !== 'completed') {
      cleanUpdates.completed_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('tasks')
      .update(cleanUpdates)
      .eq('id', id);

    if (error) {
      console.error('Update task error:', error);
      return { success: false, error: 'Failed to update task' };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'task.update',
      resource_type: 'tasks',
      resource_id: id,
      metadata: cleanUpdates,
    });

    revalidatePath('/dashboard/crm/tasks');
    revalidatePath(`/dashboard/crm/tasks/${id}`);

    return { success: true };
  } catch (error) {
    console.error('Update task error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to update task' };
  }
}

/**
 * Delete task
 */
export async function deleteTask(taskId: string) {
  try {
    const session = await requirePermission('tasks.delete');
    const userId = session.user.id;

    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      return { success: false, error: 'Failed to delete task' };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'task.delete',
      resource_type: 'tasks',
      resource_id: taskId,
    });

    revalidatePath('/dashboard/crm/tasks');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete task',
    };
  }
}

/**
 * Get all tasks (with filters)
 */
export async function getTasks(filters?: {
  status?: string;
  priority?: string;
  assignedTo?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  limit?: number;
}) {
  try {
    await requirePermission('tasks.read');

    let query = supabaseAdmin
      .from('tasks')
      .select(`
        *,
        contacts(first_name, last_name),
        companies(name),
        deals(name),
        assigned:users!tasks_assigned_to_fkey(name),
        creator:users!tasks_created_by_fkey(name)
      `)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    if (filters?.contactId) {
      query = query.eq('contact_id', filters.contactId);
    }

    if (filters?.companyId) {
      query = query.eq('company_id', filters.companyId);
    }

    if (filters?.dealId) {
      query = query.eq('deal_id', filters.dealId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(100);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Get tasks error:', error);
      return { success: false, error: 'Failed to fetch tasks' };
    }

    return { success: true, tasks: tasks || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tasks',
    };
  }
}

/**
 * Get single task with full details
 */
export async function getTask(taskId: string) {
  try {
    await requirePermission('tasks.read');

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        contacts(id, first_name, last_name, email),
        companies(id, name),
        deals(id, name, amount),
        assigned:users!tasks_assigned_to_fkey(id, name, email),
        creator:users!tasks_created_by_fkey(id, name, email)
      `)
      .eq('id', taskId)
      .single();

    if (error || !task) {
      return { success: false, error: 'Task not found' };
    }

    return {
      success: true,
      task,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch task',
    };
  }
}

/**
 * Mark task as completed
 */
export async function completeTask(taskId: string) {
  try {
    const session = await requirePermission('tasks.update');
    const userId = session.user.id;

    const { error } = await supabaseAdmin
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) {
      return { success: false, error: 'Failed to complete task' };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'task.complete',
      resource_type: 'tasks',
      resource_id: taskId,
    });

    revalidatePath('/dashboard/crm/tasks');
    revalidatePath(`/dashboard/crm/tasks/${taskId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete task',
    };
  }
}
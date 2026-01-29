/**
 * CRM Deals Server Actions
 * 
 * Deal/opportunity management with pipeline tracking
 */

'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createDealSchema = z.object({
  name: z.string().min(1, 'Deal name is required').max(255),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  stage: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  probability: z.number().min(0).max(100),
  contactId: z.string().uuid().optional().or(z.literal('')),
  companyId: z.string().uuid().optional().or(z.literal('')),
  expectedCloseDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Create a new deal
 */
export async function createDeal(data: z.infer<typeof createDealSchema>) {
  try {
    const session = await requirePermission('deals.create');
    const userId = session.user.id;

    const validated = createDealSchema.parse(data);

    const { data: deal, error } = await supabaseAdmin
      .from('deals')
      .insert({
        name: validated.name,
        description: validated.description || null,
        amount: validated.amount,
        stage: validated.stage,
        probability: validated.probability,
        contact_id: validated.contactId || null,
        company_id: validated.companyId || null,
        expected_close_date: validated.expectedCloseDate || null,
        tags: validated.tags || [],
        owner_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Create deal error:', error);
      return { success: false, error: 'Failed to create deal' };
    }

    // Log activity
    await supabaseAdmin.from('activities').insert({
      activity_type: 'note',
      subject: 'Deal created',
      description: `New deal "${validated.name}" created at ${validated.stage} stage`,
      deal_id: deal.id,
      contact_id: validated.contactId || null,
      company_id: validated.companyId || null,
      created_by: userId,
    });

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'deal.create',
      resource_type: 'deals',
      resource_id: deal.id,
      metadata: { name: validated.name, amount: validated.amount },
    });

    revalidatePath('/dashboard/crm/deals');

    return { success: true, deal };
  } catch (error) {
    console.error('Create deal error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to create deal' };
  }
}

/**
 * Update deal stage (move through pipeline)
 */
export async function updateDealStage(
  dealId: string,
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
) {
  try {
    const session = await requirePermission('deals.update');
    const userId = session.user.id;

    // Get current deal
    const { data: deal } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (!deal) {
      return { success: false, error: 'Deal not found' };
    }

    const updates: any = { stage };

    // Set probability based on stage
    const stageProbabilities: Record<string, number> = {
      prospecting: 10,
      qualification: 25,
      proposal: 50,
      negotiation: 75,
      closed_won: 100,
      closed_lost: 0,
    };

    updates.probability = stageProbabilities[stage] || deal.probability;

    // Set closed date if closing
    if (stage === 'closed_won' || stage === 'closed_lost') {
      updates.closed_date = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('deals')
      .update(updates)
      .eq('id', dealId);

    if (error) {
      return { success: false, error: 'Failed to update deal stage' };
    }

    // Log activity
    await supabaseAdmin.from('activities').insert({
      activity_type: 'deal_stage_change',
      subject: `Deal moved to ${stage}`,
      description: `Deal "${deal.name}" moved from ${deal.stage} to ${stage}`,
      deal_id: dealId,
      contact_id: deal.contact_id,
      company_id: deal.company_id,
      created_by: userId,
    });

    revalidatePath('/dashboard/crm/deals');
    revalidatePath(`/dashboard/crm/deals/${dealId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update deal stage',
    };
  }
}

/**
 * Close deal (won/lost)
 */
export async function closeDeal(
  dealId: string,
  outcome: 'closed_won' | 'closed_lost',
  note?: string
) {
  try {
    const session = await requirePermission('deals.close');
    const userId = session.user.id;

    const result = await updateDealStage(dealId, outcome);

    if (!result.success) {
      return result;
    }

    // Add note if provided
    if (note) {
      await supabaseAdmin.from('activities').insert({
        activity_type: 'note',
        subject: `Deal ${outcome === 'closed_won' ? 'won' : 'lost'}`,
        description: note,
        deal_id: dealId,
        created_by: userId,
      });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to close deal',
    };
  }
}

/**
 * Get all deals with filters
 */
export async function getDeals(filters?: {
  stage?: string;
  companyId?: string;
  contactId?: string;
  ownerId?: string;
}) {
  try {
    await requirePermission('deals.read');

    let query = supabaseAdmin
      .from('deals')
      .select(`
        *,
        contacts(first_name, last_name, email),
        companies(name),
        owner:users!deals_owner_id_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.stage) {
      query = query.eq('stage', filters.stage);
    }

    if (filters?.companyId) {
      query = query.eq('company_id', filters.companyId);
    }

    if (filters?.contactId) {
      query = query.eq('contact_id', filters.contactId);
    }

    if (filters?.ownerId) {
      query = query.eq('owner_id', filters.ownerId);
    }

    const { data: deals, error } = await query;

    if (error) {
      console.error('Get deals error:', error);
      return { success: false, error: 'Failed to fetch deals' };
    }

    return { success: true, deals: deals || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch deals',
    };
  }
}

/**
 * Get pipeline statistics
 */
export async function getPipelineStats() {
  try {
    await requirePermission('crm.reports');

    // Get deals by stage
    const { data: dealsByStage } = await supabaseAdmin
      .from('deals')
      .select('stage, amount, probability')
      .not('stage', 'in', '(closed_won,closed_lost)');

    // Calculate weighted pipeline value
    const pipelineValue = (dealsByStage || []).reduce((sum, deal) => {
      return sum + (deal.amount * (deal.probability / 100));
    }, 0);

    // Get closed deals this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { data: closedThisMonth } = await supabaseAdmin
      .from('deals')
      .select('stage, amount')
      .gte('closed_date', firstDayOfMonth.toISOString());

    const wonThisMonth = (closedThisMonth || [])
      .filter(d => d.stage === 'closed_won')
      .reduce((sum, d) => sum + d.amount, 0);

    // Count deals by stage
    const stageCounts = (dealsByStage || []).reduce((acc, deal) => {
      acc[deal.stage] = (acc[deal.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      success: true,
      stats: {
        pipelineValue,
        wonThisMonth,
        stageCounts,
        totalOpenDeals: dealsByStage?.length || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch pipeline stats',
    };
  }
}

/**
 * Get deal by ID with related activities and tasks
 */
export async function getDeal(dealId: string) {
  const { data: deal, error } = await supabaseAdmin
    .from('deals')
    .select(`
      *,
      contacts(id, first_name, last_name, email, phone),
      companies(id, name, industry),
      owner:users!deals_owner_id_fkey(name, email)
    `)
    .eq('id', dealId)
    .single();

  if (error || !deal) {
    return null;
  }

  // Get activities
  const { data: activities } = await supabaseAdmin
    .from('activities')
    .select(`
      *,
      creator:users!activities_created_by_fkey(name)
    `)
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  // Get tasks
  const { data: tasks } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('deal_id', dealId)
    .order('due_date', { ascending: true });

  return {
    ...deal,
    activities: activities || [],
    tasks: tasks || [],
  };
}

/**
 * Delete deal
 */
export async function deleteDeal(dealId: string) {
  try {
    const session = await requirePermission('deals.delete');
    const userId = session.user.id;

    const { error } = await supabaseAdmin
      .from('deals')
      .delete()
      .eq('id', dealId);

    if (error) {
      return { success: false, error: 'Failed to delete deal' };
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'deal.delete',
      resource_type: 'deals',
      resource_id: dealId,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete deal',
    };
  }
}
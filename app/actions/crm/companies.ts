/**
 * CRM Companies Server Actions
 * 
 * Full CRUD operations for company/account management
 */

'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  companyType: z.enum(['prospect', 'customer', 'partner', 'vendor', 'competitor']).default('prospect'),
  industry: z.string().max(100).optional().or(z.literal('')),
  employeeCount: z.number().int().positive().optional().or(z.literal('')),
  annualRevenue: z.number().positive().optional().or(z.literal('')),
  addressLine1: z.string().max(255).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
});

const updateCompanySchema = createCompanySchema.partial().extend({
  id: z.string().uuid(),
});

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Create a new company
 */
export async function createCompany(data: z.infer<typeof createCompanySchema>) {
  try {
    const session = await requirePermission('companies.create');
    const userId = session.user.id;

    const validated = createCompanySchema.parse(data);

    // Check if company name already exists
    const { data: existing } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('name', validated.name)
      .single();

    if (existing) {
      return { success: false, error: 'Company with this name already exists' };
    }

    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .insert({
        name: validated.name,
        website: validated.website || null,
        email: validated.email || null,
        phone: validated.phone || null,
        company_type: validated.companyType,
        industry: validated.industry || null,
        employee_count: validated.employeeCount || null,
        annual_revenue: validated.annualRevenue || null,
        address_line1: validated.addressLine1 || null,
        city: validated.city || null,
        state: validated.state || null,
        country: validated.country || null,
        tags: validated.tags || [],
        owner_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Create company error:', error);
      return { success: false, error: 'Failed to create company' };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'company.create',
      resource_type: 'companies',
      resource_id: company.id,
      metadata: { name: validated.name },
    });

    revalidatePath('/dashboard/crm/companies');

    return { success: true, company };
  } catch (error) {
    console.error('Create company error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to create company' };
  }
}

/**
 * Update company
 */
export async function updateCompany(data: z.infer<typeof updateCompanySchema>) {
  try {
    const session = await requirePermission('companies.update');
    const userId = session.user.id;

    const validated = updateCompanySchema.parse(data);
    const { id, ...updates } = validated;

    // Check if company exists
    const { data: existing } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return { success: false, error: 'Company not found' };
    }

    const cleanUpdates: any = {};
    if (updates.name) cleanUpdates.name = updates.name;
    if (updates.website !== undefined) cleanUpdates.website = updates.website || null;
    if (updates.email !== undefined) cleanUpdates.email = updates.email || null;
    if (updates.phone !== undefined) cleanUpdates.phone = updates.phone || null;
    if (updates.companyType) cleanUpdates.company_type = updates.companyType;
    if (updates.industry !== undefined) cleanUpdates.industry = updates.industry || null;
    if (updates.employeeCount !== undefined) cleanUpdates.employee_count = updates.employeeCount || null;
    if (updates.annualRevenue !== undefined) cleanUpdates.annual_revenue = updates.annualRevenue || null;
    if (updates.addressLine1 !== undefined) cleanUpdates.address_line1 = updates.addressLine1 || null;
    if (updates.city !== undefined) cleanUpdates.city = updates.city || null;
    if (updates.state !== undefined) cleanUpdates.state = updates.state || null;
    if (updates.country !== undefined) cleanUpdates.country = updates.country || null;
    if (updates.tags !== undefined) cleanUpdates.tags = updates.tags;

    const { error } = await supabaseAdmin
      .from('companies')
      .update(cleanUpdates)
      .eq('id', id);

    if (error) {
      console.error('Update company error:', error);
      return { success: false, error: 'Failed to update company' };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'company.update',
      resource_type: 'companies',
      resource_id: id,
      metadata: cleanUpdates,
    });

    revalidatePath('/dashboard/crm/companies');
    revalidatePath(`/dashboard/crm/companies/${id}`);

    return { success: true };
  } catch (error) {
    console.error('Update company error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to update company' };
  }
}

/**
 * Delete company
 */
export async function deleteCompany(companyId: string) {
  try {
    const session = await requirePermission('companies.delete');
    const userId = session.user.id;

    const { error } = await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) {
      return { success: false, error: 'Failed to delete company' };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'company.delete',
      resource_type: 'companies',
      resource_id: companyId,
    });

    revalidatePath('/dashboard/crm/companies');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete company',
    };
  }
}

/**
 * Get all companies (with filters)
 */
export async function getCompanies(filters?: {
  companyType?: string;
  industry?: string;
  search?: string;
  limit?: number;
}) {
  try {
    await requirePermission('companies.read');

    let query = supabaseAdmin
      .from('companies')
      .select(`
        *,
        owner:users!companies_owner_id_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.companyType) {
      query = query.eq('company_type', filters.companyType);
    }

    if (filters?.industry) {
      query = query.eq('industry', filters.industry);
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(100);
    }

    const { data: companies, error } = await query;

    if (error) {
      console.error('Get companies error:', error);
      return { success: false, error: 'Failed to fetch companies' };
    }

    return { success: true, companies: companies || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch companies',
    };
  }
}

/**
 * Get single company with full details
 */
export async function getCompany(companyId: string) {
  try {
    await requirePermission('companies.read');

    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .select(`
        *,
        owner:users!companies_owner_id_fkey(id, name, email)
      `)
      .eq('id', companyId)
      .single();

    if (error || !company) {
      return { success: false, error: 'Company not found' };
    }

    // Get contacts at this company
    const { data: contacts } = await supabaseAdmin
      .from('contacts')
      .select('id, first_name, last_name, email, job_title, contact_type, lead_status')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    // Get deals for this company
    const { data: deals } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    // Get activities
    const { data: activities } = await supabaseAdmin
      .from('activities')
      .select(`
        *,
        creator:users!activities_created_by_fkey(name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50);

    return {
      success: true,
      company,
      contacts: contacts || [],
      deals: deals || [],
      activities: activities || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch company',
    };
  }
}
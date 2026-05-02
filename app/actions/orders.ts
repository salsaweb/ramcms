'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createCustomerFromOrder } from './customers';
import { sendPaymentRequestEmail } from '@/lib/email/send-payment-request-email';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OrderType = 'pilot' | 'method';

export type OrderStatus =
  | 'draft'
  | 'submitted'
  | 'payment_request'
  | 'in_progress'
  | 'in_review'
  | 'delivered'
  | 'cancelled';

export interface OrderAssets {
  keys: string[];
  urls: string[];
}

export interface Order {
  id: string;
  type: OrderType;
  status: OrderStatus;
  customer_id: string | null;
  created_at: string;
  last_saved_at: string;
  property_address: string | null;
  description: string | null;
  assets: OrderAssets;
  deadline: string | null;
  rush_flag: boolean;
  created_by: string | null;
  contacts?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const orderSchema = z.object({
  type: z.enum(['pilot', 'method']),
  status: z
    .enum(['draft', 'submitted', 'payment_request', 'in_progress', 'in_review', 'delivered', 'cancelled'])
    .default('draft'),
  customer_id: z.string().uuid('Invalid customer ID').optional().or(z.literal('')),
  property_address: z.string().optional(),
  description: z.string().optional(),
  deadline: z.string().optional(), // ISO date string YYYY-MM-DD
  rush_flag: z.boolean().default(false),
  // New customer fields (used only when creating inline)
  new_customer_first: z.string().optional(),
  new_customer_last: z.string().optional(),
  new_customer_email: z.string().email().optional().or(z.literal('')),
  new_customer_phone: z.string().optional(),
});

const updateOrderSchema = orderSchema.extend({
  id: z.string().uuid('Invalid order ID'),
  // Assets updated via separate action
});

// ---------------------------------------------------------------------------
// getOrders
// Admin sees all; customer (orders.view_own) sees only their own.
// ---------------------------------------------------------------------------

export async function getOrders(filters?: {
  status?: OrderStatus;
  type?: OrderType;
  customerId?: string;
}) {
  try {
    const session = await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);
    const userPermissions: string[] = session.user.permissions || [];

    const isAdmin = userPermissions.includes(PERMISSIONS.ORDERS_READ);
    const isCustomer = userPermissions.includes(PERMISSIONS.ORDERS_VIEW_OWN);

    let query = supabaseAdmin
      .from('orders')
      .select(
        `*, contacts!orders_customer_id_fkey(id, first_name, last_name, email)`
      )
      .order('created_at', { ascending: false });

    if (isAdmin) {
      // Admin: optional filters
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.customerId) query = query.eq('customer_id', filters.customerId);
    } else if (isCustomer) {
      // Customer: only their own orders via linked contact
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('contact_type', 'customer')
        .single();

      if (!contact) return { success: true, orders: [] };
      query = query.eq('customer_id', contact.id);
    } else {
      return { success: false, error: 'Insufficient permissions', orders: [] };
    }

    const { data, error } = await query;

    if (error) {
      console.error('getOrders error:', error);
      return { success: false, error: error.message, orders: [] };
    }

    return { success: true, orders: (data || []) as Order[] };
  } catch (error) {
    console.error('getOrders exception:', error);
    return { success: false, error: 'Unexpected error', orders: [] };
  }
}

// ---------------------------------------------------------------------------
// getOrderById
// ---------------------------------------------------------------------------

export async function getOrderById(id: string) {
  try {
    const session = await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);
    const userPermissions: string[] = session.user.permissions || [];

    const isAdmin = userPermissions.includes(PERMISSIONS.ORDERS_READ);
    const isCustomer = userPermissions.includes(PERMISSIONS.ORDERS_VIEW_OWN);

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`*, contacts!orders_customer_id_fkey(id, first_name, last_name, email)`)
      .eq('id', id)
      .single();

    if (error || !data) return null;

    // Customers can only see their own orders
    if (!isAdmin && isCustomer) {
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('contact_type', 'customer')
        .single();

      if (!contact || data.customer_id !== contact.id) return null;
    }

    return data as Order;
  } catch (error) {
    console.error('getOrderById exception:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// createOrder
// Optionally creates a new customer inline if no customer_id is provided.
// ---------------------------------------------------------------------------

export async function createOrder(formData: FormData) {
  try {
    const session = await requirePermission(PERMISSIONS.ORDERS_CREATE);

    const rawData = {
      type: formData.get('type') as string,
      status: (formData.get('status') as string) || 'draft',
      customer_id: (formData.get('customer_id') as string) || '',
      property_address: (formData.get('property_address') as string) || '',
      description: (formData.get('description') as string) || '',
      deadline: (formData.get('deadline') as string) || '',
      rush_flag: formData.get('rush_flag') === 'true',
      new_customer_first: (formData.get('new_customer_first') as string) || '',
      new_customer_last: (formData.get('new_customer_last') as string) || '',
      new_customer_email: (formData.get('new_customer_email') as string) || '',
      new_customer_phone: (formData.get('new_customer_phone') as string) || '',
    };

    const validated = orderSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message || 'Validation failed' };
    }

    const input = validated.data;
    let customerId = input.customer_id || null;

    // If no customer selected but new customer fields provided, create one inline
    if (!customerId && input.new_customer_first && input.new_customer_last) {
      const result = await createCustomerFromOrder({
        firstName: input.new_customer_first,
        lastName: input.new_customer_last,
        email: input.new_customer_email || undefined,
        phone: input.new_customer_phone || undefined,
        ownerId: session.user.id,
      });

      if (!result.success || !result.customerId) {
        return { success: false, error: result.error || 'Failed to create customer' };
      }

      customerId = result.customerId;
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert({
        type: input.type,
        status: input.status,
        customer_id: customerId || null,
        property_address: input.property_address || null,
        description: input.description || null,
        deadline: input.deadline || null,
        rush_flag: input.rush_flag,
        assets: { keys: [], urls: [] },
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('createOrder error:', error);
      return { success: false, error: error.message };
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'orders.create',
      resource_type: 'orders',
      resource_id: order.id,
    });

    revalidatePath('/dashboard/orders');
    if (customerId) revalidatePath(`/dashboard/customers/${customerId}`);
    return { success: true, orderId: order.id };
  } catch (error) {
    console.error('createOrder exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

export async function sendOrderPaymentRequestEmail(order: Order) {
  try {
    await sendPaymentRequestEmail(order.contacts?.email || '', order.contacts?.first_name || 'Valued Customer');
    return { success: true };
  } catch (error) {
    console.error('updateOrderStatus exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

// ---------------------------------------------------------------------------
// updateOrder
// ---------------------------------------------------------------------------

export async function updateOrder(formData: FormData) {
  try {
    const session = await requirePermission(PERMISSIONS.ORDERS_UPDATE);

    const rawData = {
      id: formData.get('id') as string,
      type: formData.get('type') as string,
      status: formData.get('status') as string,
      customer_id: (formData.get('customer_id') as string) || '',
      property_address: (formData.get('property_address') as string) || '',
      description: (formData.get('description') as string) || '',
      deadline: (formData.get('deadline') as string) || '',
      rush_flag: formData.get('rush_flag') === 'true',
      new_customer_first: '',
      new_customer_last: '',
    };

    const validated = updateOrderSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message || 'Validation failed' };
    }

    const input = validated.data;

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        type: input.type,
        status: input.status,
        customer_id: input.customer_id || null,
        property_address: input.property_address || null,
        description: input.description || null,
        deadline: input.deadline || null,
        rush_flag: input.rush_flag,
      })
      .eq('id', input.id);

    if (error) {
      return { success: false, error: error.message };
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'orders.update',
      resource_type: 'orders',
      resource_id: input.id,
    });

    revalidatePath('/dashboard/orders');
    revalidatePath(`/dashboard/orders/${input.id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

// ---------------------------------------------------------------------------
// updateOrderAssets
// ---------------------------------------------------------------------------

export async function updateOrderAssets(
  orderId: string,
  assets: OrderAssets
) {
  try {
    await requirePermission(PERMISSIONS.ORDERS_UPDATE);

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ assets })
      .eq('id', orderId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

// ---------------------------------------------------------------------------
// updateOrderStatus — quick status update
// ---------------------------------------------------------------------------

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    const session = await requirePermission(PERMISSIONS.ORDERS_UPDATE);

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) return { success: false, error: error.message };

    await supabaseAdmin.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'orders.status_change',
      resource_type: 'orders',
      resource_id: orderId,
      metadata: { new_status: status },
    });

    revalidatePath('/dashboard/orders');
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

// ---------------------------------------------------------------------------
// deleteOrder
// ---------------------------------------------------------------------------

export async function deleteOrder(id: string) {
  try {
    const session = await requirePermission(PERMISSIONS.ORDERS_DELETE);

    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await supabaseAdmin.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'orders.delete',
      resource_type: 'orders',
      resource_id: id,
    });

    revalidatePath('/dashboard/orders');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

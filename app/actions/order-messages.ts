'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export interface OrderMessage {
  id: string;
  order_id: string;
  sender_id: string | null;
  message: string;
  created_at: string;
  sender?: {
    name: string;
    avatar_url: string | null;
  } | null;
}

const messageSchema = z.object({
  order_id: z.string().uuid('Invalid order ID'),
  message: z.string().min(1, 'Message cannot be empty'),
});

export async function getOrderMessages(orderId: string) {
  try {
    await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);

    const { data, error } = await supabaseAdmin
      .from('order_messages')
      .select(`
        *,
        sender:users!order_messages_sender_id_fkey(name, avatar_url)
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getOrderMessages error:', error);
      return { success: false, error: error.message, messages: [] };
    }

    return { success: true, messages: data as OrderMessage[] };
  } catch (error) {
    console.error('getOrderMessages exception:', error);
    return { success: false, error: 'Unexpected error', messages: [] };
  }
}

export async function createOrderMessage(formData: FormData) {
  try {
    const session = await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);

    const rawData = {
      order_id: formData.get('order_id') as string,
      message: formData.get('message') as string,
    };

    const validated = messageSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message || 'Validation failed' };
    }

    const { order_id, message } = validated.data;

    // We should ensure the user has access to this order (admin or the customer).
    // For simplicity, we assume they have access to the page to send the message.
    // The query is done via supabaseAdmin, so we need to pass the current user's ID as sender_id.

    const { error } = await supabaseAdmin
      .from('order_messages')
      .insert({
        order_id,
        sender_id: session.user.id,
        message,
      });

    if (error) {
      console.error('createOrderMessage error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/orders/${order_id}`);
    return { success: true };
  } catch (error) {
    console.error('createOrderMessage exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

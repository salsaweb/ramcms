'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createEventSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  type: z.enum(['workshop', 'retreat', 'class', 'other']),
  status: z.enum(['draft', 'published', 'cancelled']).default('published'),
  location_id: z.string().uuid().optional().nullable(),
  address: z.string().optional(),
  start_date: z.string(),
  end_date: z.string(),
  price_guide: z.string().optional(),
  max_attendees: z.number().int().positive().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
});

export async function createEvent(formData: FormData) {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.EVENTS_CREATE);
    const userId = sessionUser.user.id;

    // Parse dates and attendees safely
    const maxAttendeesStr = formData.get('max_attendees') as string;
    
    const inputData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string || 'other',
      status: formData.get('status') as string || 'published',
      location_id: formData.get('location_id') as string || null,
      address: formData.get('address') as string || null,
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      price_guide: formData.get('price_guide') as string || null,
      max_attendees: maxAttendeesStr ? parseInt(maxAttendeesStr) : null,
      image_url: formData.get('image_url') as string || null,
    };

    const validated = createEventSchema.safeParse(inputData);

    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    const d = validated.data;

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .insert({
        created_by: userId,
        title: d.title,
        description: d.description || null,
        type: d.type,
        status: d.status,
        location_id: d.location_id || null,
        address: d.address || null,
        start_date: new Date(d.start_date).toISOString(),
        end_date: new Date(d.end_date).toISOString(),
        price_guide: d.price_guide || null,
        max_attendees: d.max_attendees || null,
        image_url: d.image_url || null,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/events');
    return { success: true, event };

  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create event.' };
  }
}

export async function getEvents(filters?: { status?: string, type?: string }) {
  try {
    await requirePermission(PERMISSIONS.EVENTS_READ);

    let query = supabaseAdmin
      .from('events')
      .select(`
        *,
        users!created_by (name),
        locations (name, city, country)
      `)
      .order('start_date', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    } else {
      // By default only show upcoming published events
      query = query.eq('status', 'published').gte('start_date', new Date().toISOString());
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Get RSVP counts for each event safely
     const { data: rsvps } = await supabaseAdmin
       .from('event_rsvps')
       .select('event_id, status')
       .eq('status', 'attending');

     const mappedEvents = data.map(ev => {
        const attendeeCount = rsvps?.filter(r => r.event_id === ev.id).length || 0;
        return { ...ev, attendeeCount };
     });

    return { success: true, events: mappedEvents };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch events.' };
  }
}

export async function getEventById(id: string) {
    try {
      const sessionUser = await requirePermission(PERMISSIONS.EVENTS_READ);
      const userId = sessionUser.user.id;
  
      const { data: event, error } = await supabaseAdmin
        .from('events')
        .select(`
          *,
          users!created_by (name, email),
          locations (name, city, country, address, latitude, longitude)
        `)
        .eq('id', id)
        .single();
  
      if (error || !event) throw error || new Error('Event not found');

      // Check current user RSVP status
      const { data: userRsvp } = await supabaseAdmin
        .from('event_rsvps')
        .select('status')
        .eq('event_id', id)
        .eq('user_id', userId)
        .single();
        
      // Fetch attendee rosters only if creator or admin
      const { data: permissions } = await supabaseAdmin.rpc('get_user_permissions', { p_user_id: userId });
      const canManage = permissions?.some((p: any) => p.permission_name === PERMISSIONS.EVENTS_MANAGE);
      let attendees: any[] = [];
      const isOwner = event.created_by === userId;

      if (isOwner || canManage) {
         const { data: rsvps } = await supabaseAdmin
            .from('event_rsvps')
            .select(`
                status,
                created_at,
                users!user_id (id, name, email)
            `)
            .eq('event_id', id)
            .eq('status', 'attending');
            
         attendees = rsvps || [];
      } else {
         // Even if not owner, we need the total count to show "14/20 Going"
         const { count } = await supabaseAdmin
            .from('event_rsvps')
            .select('id', { count: 'exact' })
            .eq('event_id', id)
            .eq('status', 'attending');
         
         (event as any).attendeeCount = count || 0;
      }
  
      return { 
          success: true, 
          event, 
          userRsvp: userRsvp?.status || null,
          attendees 
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch event.' };
    }
}

export async function submitRsvp(eventId: string, attending: boolean) {
    try {
        const sessionUser = await requirePermission(PERMISSIONS.RSVPS_CREATE);
        const userId = sessionUser.user.id;

        const newStatus = attending ? 'attending' : 'cancelled';

        const { error } = await supabaseAdmin
            .from('event_rsvps')
            .upsert({
                event_id: eventId,
                user_id: userId,
                status: newStatus
            }, { onConflict: 'event_id,user_id' });

        if (error) throw error;

        revalidatePath(`/dashboard/events/${eventId}`);
        revalidatePath(`/dashboard/events`);
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to RSVP.' };
    }
}

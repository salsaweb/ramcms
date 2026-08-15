'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullish(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').nullish().or(z.literal('')),
  twitterHandle: z.string().nullish(),
  facebookUrl: z.string().url('Invalid Facebook URL').nullish().or(z.literal('')),
  instagram: z.string().nullish(),
  youtube: z.string().url('Invalid YouTube URL').nullish().or(z.literal('')),
  bio: z.string().nullish(),
  website: z.string().url('Invalid URL format').nullish().or(z.literal('')),
  locationName: z.string().nullish(),
});

/**
 * Fetch the current user's profile and linked participant (contact) record if it exists.
 */
export async function getMyProfile() {
  try {
    const session = await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);
    const userId = session.user.id;

    // Fetch user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, avatar_url')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found' };
    }

    // Fetch linked participant details (contacts table where user_id = current user)
    const { data: contact } = await supabaseAdmin
      .from('contacts')
      .select('id, phone, linkedin_url, twitter_handle, facebook_url, custom_fields')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    // Fetch linked practitioner details
    const { data: practitioner } = await supabaseAdmin
      .from('practitioners')
      .select('bio, website, location_name, phone, social_links')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    return { 
      success: true, 
      user, 
      participant: contact || null,
      practitioner: practitioner || null,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to load profile' };
  }
}

/**
 * Update the current user's profile.
 */
export async function updateMyProfile(formData: FormData) {
  try {
    const session = await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);
    const userId = session.user.id;

    const inputData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string | null,
      linkedinUrl: formData.get('linkedinUrl') as string | null,
      twitterHandle: formData.get('twitterHandle') as string | null,
      facebookUrl: formData.get('facebookUrl') as string | null,
      instagram: formData.get('instagram') as string | null,
      youtube: formData.get('youtube') as string | null,
      bio: formData.get('bio') as string | null,
      website: formData.get('website') as string | null,
      locationName: formData.get('locationName') as string | null,
    };

    const validated = updateProfileSchema.safeParse(inputData);

    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message || 'Validation failed' };
    }

    const input = validated.data;

    // 1. Update Core User Account
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({
        name: input.name,
        email: input.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userUpdateError) {
      return { success: false, error: userUpdateError.message };
    }

    // 2. Update Linked Contact Record (if it exists)
    // We split name into first and last name for the contact record
    const nameParts = input.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ' ';

    const { error: contactUpdateError } = await supabaseAdmin
      .from('contacts')
      .update({
        first_name: firstName,
        last_name: lastName,
        email: input.email,
        phone: input.phone || null,
        linkedin_url: input.linkedinUrl || null,
        twitter_handle: input.twitterHandle || null,
        facebook_url: input.facebookUrl || null,
        custom_fields: { 
          // Merge with possible existing fields if needed, but for now we just handle these two
          ...(input.instagram ? { instagram: input.instagram } : {}),
          ...(input.youtube ? { youtube: input.youtube } : {})
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (contactUpdateError) {
      console.warn('Silent issue updating linked contact:', contactUpdateError.message);
    }

    // 3. Update Linked Practitioner Record (if it exists)
    // Attempt update if they submitted practitioner fields
    const hasPracFields = input.bio !== undefined || input.website !== undefined || input.locationName !== undefined;
    const hasSocialFields = input.instagram !== undefined || input.youtube !== undefined || input.linkedinUrl !== undefined || input.phone !== undefined;
    
    if (hasPracFields || hasSocialFields) {
      const { data: existingPrac } = await supabaseAdmin
        .from('practitioners')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (existingPrac) {
        await supabaseAdmin
          .from('practitioners')
          .update({
            bio: input.bio || null,
            website: input.website || null,
            location_name: input.locationName || null,
            phone: input.phone || null,
            social_links: {
              instagram: input.instagram || undefined,
              twitter_handle: input.twitterHandle || undefined,
              facebook_url: input.facebookUrl || undefined,
              youtube: input.youtube || undefined,
              linkedin_url: input.linkedinUrl || undefined,
            },
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    }

    revalidatePath('/dashboard/settings/profile');
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
  }
}

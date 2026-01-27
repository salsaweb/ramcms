/**
 * Post Management Server Actions
 * 
 * CRITICAL: Every action checks permissions via guards.
 * This is the FINAL AUTHORITY for authorization.
 */

'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createPostSchema, updatePostSchema, publishPostSchema } from '@/lib/validations/schemas';
import { 
  requirePermission, 
  requireOwnershipOrPermission,
  requireAuth 
} from '@/lib/rbac/guards';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { revalidatePath } from 'next/cache';

/**
 * Create a new post
 * 
 * Permission: posts.create
 */
export async function createPost(formData: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status?: 'draft' | 'published' | 'archived';
  categoryIds?: number[];
  tagIds?: number[];
}) {
  try {
    // Check permission
    const session = await requirePermission(PERMISSIONS.POSTS_CREATE);
    const authorId = session.user.id;

    // Validate input
    const validated = createPostSchema.safeParse(formData);
    
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0].message,
      };
    }

    const { categoryIds, tagIds, ...postData } = validated.data;

    // Check slug uniqueness
    const { data: existingPost } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('slug', postData.slug)
      .single();

    if (existingPost) {
      return {
        success: false,
        error: 'Slug already exists',
      };
    }

    // Create post
    const { data: newPost, error: createError } = await supabaseAdmin
      .from('posts')
      .insert({
        ...postData,
        author_id: authorId,
        excerpt: postData.excerpt || null,
        featured_image: postData.featuredImage || null,
        published_at: postData.status === 'published' ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (createError || !newPost) {
      console.error('Post creation failed:', createError);
      return {
        success: false,
        error: 'Failed to create post',
      };
    }

    // Assign categories
    if (categoryIds && categoryIds.length > 0) {
      await supabaseAdmin
        .from('post_categories')
        .insert(categoryIds.map((categoryId: number) => ({
          post_id: newPost.id,
          category_id: categoryId,
        })));
    }

    // Assign tags
    if (tagIds && tagIds.length > 0) {
      await supabaseAdmin
        .from('post_tags')
        .insert(tagIds.map((tagId: number) => ({
          post_id: newPost.id,
          tag_id: tagId,
        })));
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: authorId,
      action: 'post.create',
      resource_type: 'posts',
      resource_id: newPost.id,
      metadata: { title: postData.title, slug: postData.slug },
    });

    revalidatePath('/dashboard/posts');

    return {
      success: true,
      postId: newPost.id,
    };
  } catch (error) {
    console.error('Create post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create post',
    };
  }
}

/**
 * Update a post
 * 
 * Permission: posts.update OR ownership with posts.update_own
 */
export async function updatePost(formData: {
  id: string;
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  categoryIds?: number[];
  tagIds?: number[];
}) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Validate input
    const validated = updatePostSchema.safeParse(formData);
    
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0].message,
      };
    }

    const { id, categoryIds, tagIds, ...updates } = validated.data;

    // Fetch existing post
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('author_id')
      .eq('id', id)
      .single();

    if (!post) {
      return {
        success: false,
        error: 'Post not found',
      };
    }

    // Check ownership or override permission
    await requireOwnershipOrPermission(post.author_id, PERMISSIONS.POSTS_UPDATE);

    // Update post
    const cleanUpdates: any = {};
    if (updates.title) cleanUpdates.title = updates.title;
    if (updates.slug) cleanUpdates.slug = updates.slug;
    if (updates.content) cleanUpdates.content = updates.content;
    if (updates.excerpt !== undefined) cleanUpdates.excerpt = updates.excerpt || null;
    if (updates.featuredImage !== undefined) cleanUpdates.featured_image = updates.featuredImage || null;

    const { error: updateError } = await supabaseAdmin
      .from('posts')
      .update(cleanUpdates)
      .eq('id', id);

    if (updateError) {
      console.error('Post update failed:', updateError);
      return {
        success: false,
        error: 'Failed to update post',
      };
    }

    // Update categories if provided
    if (categoryIds !== undefined) {
      await supabaseAdmin.from('post_categories').delete().eq('post_id', id);
      
      if (categoryIds.length > 0) {
        await supabaseAdmin
          .from('post_categories')
          .insert(categoryIds.map((categoryId: number) => ({
            post_id: id,
            category_id: categoryId,
          })));
      }
    }

    // Update tags if provided
    if (tagIds !== undefined) {
      await supabaseAdmin.from('post_tags').delete().eq('post_id', id);
      
      if (tagIds.length > 0) {
        await supabaseAdmin
          .from('post_tags')
          .insert(tagIds.map((tagId: number) => ({
            post_id: id,
            tag_id: tagId,
          })));
      }
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'post.update',
      resource_type: 'posts',
      resource_id: id,
      metadata: updates,
    });

    revalidatePath('/dashboard/posts');
    revalidatePath(`/dashboard/posts/${id}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Update post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update post',
    };
  }
}

/**
 * Publish/unpublish a post
 * 
 * Permission: posts.publish
 */
export async function publishPost(formData: {
  id: string;
  status: 'published' | 'draft' | 'archived';
}) {
  try {
    const session = await requirePermission(PERMISSIONS.POSTS_PUBLISH);
    const userId = session.user.id;

    const validated = publishPostSchema.safeParse(formData);
    
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0].message,
      };
    }

    const { id, status } = validated.data;

    const updates: any = { status };
    
    if (status === 'published') {
      updates.published_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('posts')
      .update(updates)
      .eq('id', id);

    if (error) {
      return {
        success: false,
        error: 'Failed to update post status',
      };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: `post.${status}`,
      resource_type: 'posts',
      resource_id: id,
      metadata: { status },
    });

    revalidatePath('/dashboard/posts');

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish post',
    };
  }
}

/**
 * Delete a post
 * 
 * Permission: posts.delete
 */
export async function deletePost(postId: string) {
  try {
    const session = await requirePermission(PERMISSIONS.POSTS_DELETE);
    const userId = session.user.id;

    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      return {
        success: false,
        error: 'Failed to delete post',
      };
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'post.delete',
      resource_type: 'posts',
      resource_id: postId,
    });

    revalidatePath('/dashboard/posts');

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete post',
    };
  }
}
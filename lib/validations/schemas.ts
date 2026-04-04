/**
 * Validation Schemas
 * 
 * Zod schemas for runtime validation of all inputs.
 * Used in Server Actions and API routes.
 */

import { z } from 'zod';

// =====================================================
// AUTH SCHEMAS
// =====================================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name too long')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/\d/, 'Password must contain a number')
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      'Password must contain special character'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/\d/, 'Must contain number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Must contain special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/\d/, 'Must contain number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Must contain special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// =====================================================
// POST SCHEMAS
// =====================================================

export const createPostSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(500, 'Title too long')
    .trim(),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(500, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
    .trim(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  featuredImage: z.string().url('Invalid image URL').optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  categoryIds: z.array(z.number()).optional(),
  tagIds: z.array(z.number()).optional(),
});

export const updatePostSchema = createPostSchema.partial().extend({
  id: z.string().uuid('Invalid post ID'),
});

export const publishPostSchema = z.object({
  id: z.string().uuid('Invalid post ID'),
  status: z.enum(['published', 'draft', 'archived']),
});

// =====================================================
// USER MANAGEMENT SCHEMAS
// =====================================================

export const createUserSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(100),
  roleId: z.number().int().positive(),
});

export const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(255).trim().optional(),
  email: z.string().email().toLowerCase().trim().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export const assignRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  roleId: z.number().int().positive('Invalid role ID'),
});

// =====================================================
// CATEGORY & TAG SCHEMAS
// =====================================================

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100).trim(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens')
    .trim(),
  description: z.string().max(500).optional(),
});

export const createTagSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens')
    .trim(),
});

// =====================================================
// SEARCH & FILTER SCHEMAS
// =====================================================

export const searchPostsSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  authorId: z.string().uuid().optional(),
  categoryId: z.number().int().positive().optional(),
  tagId: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

// =====================================================
// TYPE EXPORTS
// =====================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SearchPostsInput = z.infer<typeof searchPostsSchema>;
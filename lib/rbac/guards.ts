/**
 * RBAC Guards
 * 
 * Protection layer for Server Actions and API routes.
 * These are the FINAL AUTHORITY for authorization.
 * 
 * Usage:
 * - Wrap Server Actions with requirePermission()
 * - Use checkPermission() for conditional logic
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Permission, userHasPermission, userHasAllPermissions } from './permissions';

/**
 * Get the current session with type safety
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Require authentication
 * Throws if no session exists
 */
export async function requireAuth() {
  const session = await getSession();
  
  if (!session || !session.user) {
    throw new Error('Unauthorized - Authentication required');
  }
  
  return session;
}

/**
 * Require a specific permission
 * Throws if user doesn't have permission
 * 
 * @param permission - Required permission
 * @returns Session with user data
 * 
 * @example
 * export async function deletePost(postId: string) {
 *   const session = await requirePermission('posts.delete');
 *   // ... delete logic
 * }
 */
export async function requirePermission(permission: Permission) {
  const session = await requireAuth();
  const userId = session.user.id;
  
  const hasPermission = await userHasPermission(userId, permission);
  
  if (!hasPermission) {
    throw new Error(`Forbidden - Missing permission: ${permission}`);
  }
  
  return session;
}

/**
 * Require ALL specified permissions
 * 
 * @param permissions - Array of required permissions
 * @returns Session with user data
 */
export async function requireAllPermissions(permissions: Permission[]) {
  const session = await requireAuth();
  const userId = session.user.id;
  
  const hasAll = await userHasAllPermissions(userId, permissions);
  
  if (!hasAll) {
    throw new Error(`Forbidden - Missing permissions: ${permissions.join(', ')}`);
  }
  
  return session;
}

/**
 * Check if current user has a permission (non-throwing)
 * 
 * @param permission - Permission to check
 * @returns Promise<boolean>
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session?.user?.id) return false;
    
    return userHasPermission(session.user.id, permission);
  } catch {
    return false;
  }
}

/**
 * Ownership check utility
 * Verifies if user owns a resource OR has override permission
 * 
 * @param resourceOwnerId - UUID of resource owner
 * @param overridePermission - Permission that allows access regardless of ownership
 * @returns Promise<boolean>
 * 
 * @example
 * const canEdit = await canAccessResource(post.author_id, 'posts.update');
 */
export async function canAccessResource(
  resourceOwnerId: string,
  overridePermission: Permission
): Promise<boolean> {
  const session = await getSession();
  if (!session?.user?.id) return false;
  
  // User owns the resource
  if (session.user.id === resourceOwnerId) return true;
  
  // User has override permission
  return userHasPermission(session.user.id, overridePermission);
}

/**
 * Assert ownership or permission
 * Throws if user doesn't own resource and lacks override permission
 * 
 * @param resourceOwnerId - UUID of resource owner
 * @param overridePermission - Permission that allows access
 */
export async function requireOwnershipOrPermission(
  resourceOwnerId: string,
  overridePermission: Permission
) {
  const session = await requireAuth();
  const userId = session.user.id;
  
  // Check ownership first (fast path)
  if (userId === resourceOwnerId) return session;
  
  // Check override permission
  const hasPermission = await userHasPermission(userId, overridePermission);
  
  if (!hasPermission) {
    throw new Error(
      `Forbidden - You don't own this resource and lack permission: ${overridePermission}`
    );
  }
  
  return session;
}

/**
 * Utility: Get current user ID
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id || null;
}

/**
 * Utility: Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}
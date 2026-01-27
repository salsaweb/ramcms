/**
 * Session Utilities
 * 
 * Server-side session access helpers.
 * Use these in Server Components and Server Actions.
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

/**
 * Get current session (returns null if not authenticated)
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Get current user (throws if not authenticated)
 */
export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/auth/login');
  }
  
  return session.user;
}

/**
 * Check if user has permission (client-safe check)
 * 
 * @param permission - Permission string to check
 * @returns boolean
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const session = await getSession();
  
  if (!session?.user?.permissions) {
    return false;
  }
  
  return session.user.permissions.includes(permission);
}

/**
 * Check if user has any of the permissions
 */
export async function hasAnyPermission(permissions: string[]): Promise<boolean> {
  const session = await getSession();
  
  if (!session?.user?.permissions) {
    return false;
  }
  
  return permissions.some(p => session.user.permissions.includes(p));
}

/**
 * Check if user has all permissions
 */
export async function hasAllPermissions(permissions: string[]): Promise<boolean> {
  const session = await getSession();
  
  if (!session?.user?.permissions) {
    return false;
  }
  
  return permissions.every(p => session.user.permissions.includes(p));
}

/**
 * Require permission (redirects if missing)
 */
export async function requirePermissionPage(permission: string) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/auth/login');
  }
  
  if (!session.user.permissions.includes(permission)) {
    redirect('/dashboard?error=forbidden');
  }
  
  return session;
}
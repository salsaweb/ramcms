import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  permissions?: string[];
  apiKeyId?: number;
  error?: string;
}

/**
 * Get user permissions from RBAC tables
 */
async function getUserPermissions(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select(`
      role:roles (
        role_permissions (
          permission:permissions (
            name
          )
        )
      )
    `)
    .eq('user_id', userId);

  if (error || !data) {
    console.error('Error fetching permissions:', error);
    return [];
  }

  // Extract permission names from nested structure
  const permissions: string[] = [];
  for (const userRole of data) {
    if (userRole.role?.role_permissions) {
      for (const rp of userRole.role.role_permissions) {
        if (rp.permission?.name) {
          permissions.push(rp.permission.name);
        }
      }
    }
  }

  // Remove duplicates
  return [...new Set(permissions)];
}

/**
 * Authenticate API request using API key or Bearer token
 * @param request - Next.js request object
 * @returns Authentication result with user info and permissions
 */
export async function authenticateApiRequest(request: NextRequest): Promise<AuthResult> {
  const apiKey = request.headers.get('x-api-key');
  const authorization = request.headers.get('authorization');

  // Check for API key authentication
  if (apiKey) {
    return await authenticateWithApiKey(apiKey);
  }

  // Check for Bearer token authentication
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.substring(7);
    return await authenticateWithBearerToken(token);
  }

  return { 
    authenticated: false, 
    error: 'No authentication credentials provided. Use x-api-key header or Authorization: Bearer token' 
  };
}

/**
 * Authenticate using API key
 */
async function authenticateWithApiKey(apiKey: string): Promise<AuthResult> {
  const { data: apiKeyRecord, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, user_id, expires_at')
    .eq('key', apiKey)
    .eq('is_active', true)
    .single();

  if (error || !apiKeyRecord) {
    return { authenticated: false, error: 'Invalid API key' };
  }

  // Check expiration
  if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
    return { authenticated: false, error: 'API key expired' };
  }

  // Get user permissions from RBAC tables
  const permissions = await getUserPermissions(apiKeyRecord.user_id);

  // Update last used timestamp (fire and forget)
  supabaseAdmin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyRecord.id)
    .then(() => {})
    .catch(console.error);

  return {
    authenticated: true,
    userId: apiKeyRecord.user_id,
    permissions,
    apiKeyId: apiKeyRecord.id,
  };
}

/**
 * Authenticate using Bearer token
 */
async function authenticateWithBearerToken(token: string): Promise<AuthResult> {
  const { data: session, error } = await supabaseAdmin
    .from('api_sessions')
    .select('user_id, expires_at')
    .eq('token', token)
    .eq('is_active', true)
    .single();

  if (error || !session) {
    return { authenticated: false, error: 'Invalid bearer token' };
  }

  if (new Date(session.expires_at) < new Date()) {
    return { authenticated: false, error: 'Token expired' };
  }

  // Get user permissions from RBAC tables
  const permissions = await getUserPermissions(session.user_id);

  return {
    authenticated: true,
    userId: session.user_id,
    permissions,
  };
}

/**
 * Check if user has required permission
 */
export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required);
}

/**
 * Log API usage to database (async, non-blocking)
 */
export async function logApiUsage(
  apiKeyId: number | undefined,
  endpoint: string,
  method: string,
  status: number
): Promise<void> {
  if (!apiKeyId) return;

  try {
    await supabaseAdmin.from('api_usage_logs').insert({
      api_key_id: apiKeyId,
      endpoint,
      method,
      status,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log API usage:', error);
  }
}
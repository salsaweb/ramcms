import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { 
  authenticateApiRequest, 
  hasPermission, 
  logApiUsage 
} from '@/lib/api/auth';
import { 
  checkRateLimit, 
  createRateLimitKey, 
  RATE_LIMIT_CONFIGS,
  getRateLimitHeaders,
} from '@/lib/api/rate-limit';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  rateLimitResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response';

// ============================================
// VALIDATION SCHEMAS
// ============================================
const createContactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  company_id: z.number().optional().nullable(),
  job_title: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
});

// ============================================
// POST - CREATE CONTACT
// ============================================
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const auth = await authenticateApiRequest(request);
    
    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    // 2. Check permission
    if (!hasPermission(auth.permissions!, 'contacts.create')) {
      return forbiddenResponse('You do not have permission to create contacts');
    }

    // 3. Rate limiting
    const rateLimitKey = createRateLimitKey(auth.userId!, 'contacts:create');
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.WRITE);

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = createContactSchema.parse(body);

    // 5. Create contact
    const contact = await createContact(validatedData, auth.userId!);

    // 6. Log API usage (async, non-blocking)
    logApiUsage(auth.apiKeyId, '/api/crm/contacts', 'POST', 201);

    // 7. Return success response
    return successResponse(
      {
        contact,
        message: 'Contact created successfully',
      },
      201,
      getRateLimitHeaders(rateLimit)
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error);
    }
    return serverErrorResponse(error);
  }
}

// ============================================
// GET - LIST CONTACTS
// ============================================
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const auth = await authenticateApiRequest(request);
    
    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    // 2. Check permission
    if (!hasPermission(auth.permissions!, 'contacts.read')) {
      return forbiddenResponse('You do not have permission to read contacts');
    }

    // 3. Rate limiting
    const rateLimitKey = createRateLimitKey(auth.userId!, 'contacts:read');
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.READ);

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const search = searchParams.get('search') || '';

    // 5. Fetch contacts
    const result = await fetchContacts({ page, limit, search });

    // 6. Log API usage
    logApiUsage(auth.apiKeyId, '/api/crm/contacts', 'GET', 200);

    // 7. Return success response
    return successResponse(
      {
        contacts: result.data,
        pagination: {
          total: result.count,
          page,
          limit,
          totalPages: Math.ceil(result.count / limit),
        },
      },
      200,
      getRateLimitHeaders(rateLimit)
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// ============================================
// BUSINESS LOGIC FUNCTIONS
// ============================================

/**
 * Create a new contact in database
 */
async function createContact(data: z.infer<typeof createContactSchema>, createdBy: string) {
  const { data: contact, error } = await supabaseAdmin
    .from('contacts')
    .insert([
      {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        company_id: data.company_id,
        job_title: data.job_title,
        tags: data.tags,
        created_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to create contact');
  }

  return contact;
}

/**
 * Fetch contacts with pagination and search
 */
async function fetchContacts(params: { page: number; limit: number; search: string }) {
  const offset = (params.page - 1) * params.limit;

  let query = supabaseAdmin
    .from('contacts')
    .select('*, company:companies(id, name)', { count: 'exact' });

  if (params.search) {
    query = query.or(
      `first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%`
    );
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + params.limit - 1);

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch contacts');
  }

  return { data: data || [], count: count || 0 };
}
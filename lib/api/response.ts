import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { RateLimitResult, getRateLimitHeaders, getRetryAfterSeconds } from './rate-limit';

/**
 * Return successful JSON response
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    { success: true, ...data },
    { status, headers }
  );
}

/**
 * Return error JSON response
 */
export function errorResponse(
  error: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    { error, message, ...(details && { details }) },
    { status }
  );
}

/**
 * Return validation error response from Zod
 */
export function validationErrorResponse(zodError: ZodError): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: zodError.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    },
    { status: 400 }
  );
}

/**
 * Return unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return errorResponse('Unauthorized', message, 401);
}

/**
 * Return forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return errorResponse('Forbidden', message, 403);
}

/**
 * Return rate limit exceeded response
 */
export function rateLimitResponse(rateLimit: RateLimitResult): NextResponse {
  const retryAfter = getRetryAfterSeconds(rateLimit.resetTime);
  
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: `Too many requests. Try again in ${retryAfter} seconds.`,
      limit: rateLimit.limit,
      remaining: rateLimit.remaining,
      resetTime: new Date(rateLimit.resetTime).toISOString(),
    },
    {
      status: 429,
      headers: {
        ...getRateLimitHeaders(rateLimit),
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}

/**
 * Return internal server error response
 */
export function serverErrorResponse(
  error?: any,
  logError: boolean = true
): NextResponse {
  if (logError && error) {
    console.error('Server error:', error);
  }
  
  return errorResponse(
    'Internal server error',
    'An unexpected error occurred',
    500
  );
}

/**
 * Return not found response
 */
export function notFoundResponse(resource: string = 'Resource'): NextResponse {
  return errorResponse('Not found', `${resource} not found`, 404);
}
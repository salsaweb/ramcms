// In-memory rate limiting store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

// Default configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  DEFAULT: { windowMs: 60000, maxRequests: 10 }, // 10 requests/minute
  READ: { windowMs: 60000, maxRequests: 30 }, // 30 requests/minute
  WRITE: { windowMs: 60000, maxRequests: 10 }, // 10 requests/minute
  STRICT: { windowMs: 60000, maxRequests: 5 }, // 5 requests/minute
  GENEROUS: { windowMs: 60000, maxRequests: 100 }, // 100 requests/minute
} as const;

/**
 * Check if request is within rate limit
 * @param identifier - Unique identifier (e.g., "userId:endpoint")
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and headers
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.DEFAULT
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Cleanup expired entries periodically (prevent memory leak)
  if (rateLimitStore.size > 10000) {
    cleanupExpiredEntries(now);
  }

  // First request or window expired
  if (!record || record.resetTime < now) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Rate limit exceeded
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  // Increment count
  record.count += 1;
  rateLimitStore.set(identifier, record);

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Clear rate limit for specific identifier
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };
}

/**
 * Get retry-after seconds
 */
export function getRetryAfterSeconds(resetTime: number): number {
  return Math.ceil((resetTime - Date.now()) / 1000);
}

/**
 * Clean up expired entries from rate limit store
 */
function cleanupExpiredEntries(now: number): void {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Create rate limit identifier for user and endpoint
 */
export function createRateLimitKey(userId: string, endpoint: string): string {
  return `${userId}:${endpoint}`;
}
/**
 * JSONB Utilities
 * 
 * Helper functions for working with PostgreSQL JSONB columns
 * that may be returned as strings or already-parsed objects
 */

/**
 * Safely parse a JSONB value that might be a string or already parsed
 */
export function parseJsonb<T = any>(value: any): T | null {
  if (value === null || value === undefined) {
    return null;
  }
  
  // Already an object/array
  if (typeof value === 'object') {
    return value as T;
  }
  
  // String - try to parse
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Failed to parse JSONB:', error);
      return null;
    }
  }
  
  return null;
}

/**
 * Get array length from JSONB array (handles both string and parsed)
 */
export function getJsonbArrayLength(value: any): number {
  const parsed = parseJsonb<any[]>(value);
  return Array.isArray(parsed) ? parsed.length : 0;
}

/**
 * Ensure JSONB value is a proper JSON string for insertion
 */
export function stringifyJsonb(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  
  if (typeof value === 'string') {
    // Already a string - verify it's valid JSON
    try {
      JSON.parse(value);
      return value;
    } catch {
      // Invalid JSON string, wrap it
      return JSON.stringify(value);
    }
  }
  
  return JSON.stringify(value);
}

/**
 * Type guard to check if value is a parsed JSONB object
 */
export function isJsonbObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Type guard to check if value is a parsed JSONB array
 */
export function isJsonbArray(value: any): value is any[] {
  return Array.isArray(value);
}
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  service: string;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    spotify?: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
  };
}

/**
 * Detailed Health Check Endpoint
 * 
 * Checks:
 * - Database connectivity (Supabase)
 * - External services (Spotify API)
 * - Response times
 * 
 * Use for monitoring dashboards and detailed diagnostics.
 * Not recommended for Render.com's health check (use /api/health instead).
 */
export async function GET() {
  const checks: HealthCheckResult['checks'] = {
    database: { status: 'unhealthy' },
  };

  // Check Database
  try {
    const dbStart = Date.now();
    const { error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);

    const dbTime = Date.now() - dbStart;

    if (error) {
      checks.database = {
        status: 'unhealthy',
        error: error.message,
        responseTime: dbTime,
      };
    } else {
      checks.database = {
        status: 'healthy',
        responseTime: dbTime,
      };
    }
  } catch (error: any) {
    checks.database = {
      status: 'unhealthy',
      error: error.message || 'Database connection failed',
    };
  }

  // Check Spotify API (optional - only if credentials are configured)
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    try {
      const spotifyStart = Date.now();
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64'),
        },
        body: 'grant_type=client_credentials',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const spotifyTime = Date.now() - spotifyStart;

      checks.spotify = {
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: spotifyTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error: any) {
      checks.spotify = {
        status: 'unhealthy',
        error: error.message || 'Spotify API unreachable',
      };
    }
  }

  // Determine overall status
  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
  const anyUnhealthy = Object.values(checks).some(check => check.status === 'unhealthy');

  const overallStatus: HealthCheckResult['status'] = 
    allHealthy ? 'healthy' : 
    anyUnhealthy ? 'degraded' : 
    'unhealthy';

  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'ram-cms',
    checks,
  };

  // Return appropriate HTTP status
  const httpStatus = overallStatus === 'healthy' ? 200 : 
                     overallStatus === 'degraded' ? 200 : 
                     503;

  return NextResponse.json(result, { status: httpStatus });
}
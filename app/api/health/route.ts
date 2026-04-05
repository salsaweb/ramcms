import { NextResponse } from 'next/server';

/**
 * Basic Health Check Endpoint
 * 
 * Render.com will ping this endpoint to verify the service is running.
 * Returns 200 if the application is healthy.
 * 
 * Configure in Render.com:
 * - Health Check Path: /api/health
 * - Health Check Interval: 60 seconds (recommended)
 */
export async function GET() {
  try {
    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'ram-cms',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
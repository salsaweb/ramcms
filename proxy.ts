/**
 * Next.js Middleware
 * 
 * Route-level permission enforcement (Coarse-grained).
 * This is the FIRST line of defense, not the last.
 * 
 * Authorization hierarchy:
 * 1. Middleware (Route-level) ← You are here
 * 2. Server Actions (Data-level) ← Final authority
 * 3. Client (UI-only)
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Public routes - no auth required
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/error'];
    if (publicRoutes.some(route => path.startsWith(route))) {
      return NextResponse.next();
    }

    // Root redirect to dashboard if authenticated, login if not
    if (path === '/') {
      if (token) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Authenticated routes - require login
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const permissions = (token.permissions as string[]) || [];

    // Dashboard access
    if (path.startsWith('/dashboard')) {
      if (!permissions.includes('dashboard.access')) {
        return NextResponse.redirect(new URL('/auth/error?error=forbidden', req.url));
      }
    }

    // User management routes
    if (path.startsWith('/dashboard/users')) {
      if (!permissions.includes('users.read')) {
        return NextResponse.redirect(new URL('/dashboard?error=forbidden', req.url));
      }
    }

    // Settings routes
    if (path.startsWith('/dashboard/settings')) {
      if (!permissions.includes('settings.view')) {
        return NextResponse.redirect(new URL('/dashboard?error=forbidden', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Allow public routes without token
        const publicRoutes = ['/auth/login', '/auth/register', '/auth/error'];
        if (publicRoutes.some(route => path.startsWith(route))) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
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
import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n/request';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'es',
  localePrefix: 'always', //'as-needed',
});

function getLocaleFromPath(pathname: string) {
  const segments = pathname.split('/');
  return locales.includes(segments[1] as any)
    ? segments[1]
    : 'en';
}

export default withAuth(
  function middleware(req) {
    const response = intlMiddleware(req);
    if (response) return response;

    const token = req.nextauth.token;

    const pathname = req.nextUrl.pathname.replace(
      new RegExp(`^/(${locales.join('|')})(?=/|$)`),
      ''
    );

    const locale = getLocaleFromPath(req.nextUrl.pathname);
    const publicRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/error'
    ];

    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Root redirect to dashboard if authenticated, login if not
    if (pathname === '/' || pathname === '') {
      return NextResponse.redirect(
        new URL(token ? `/${locale}/dashboard` : `/${locale}/auth/login`, req.url)
      );
    }

    // Authenticated routes - require login
    if (!token) {
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));
    }

    const permissions = (token.permissions as string[]) || [];

    // Dashboard access
    if (pathname.startsWith('/dashboard')) {
      if (!permissions.includes('dashboard.access')) {
        return NextResponse.redirect(new URL(`/${locale}/auth/error?error=forbidden`, req.url));
      }
    }

    // User management routes
    if (pathname.startsWith('/dashboard/users')) {
      if (!permissions.includes('users.read')) {
        return NextResponse.redirect(new URL(`/${locale}/dashboard?error=forbidden`, req.url));
      }
    }

    // Settings routes
    if (pathname.startsWith('/dashboard/settings')) {
      if (!permissions.includes('settings.view')) {
        return NextResponse.redirect(new URL(`/${locale}/dashboard?error=forbidden`, req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname.replace(
          new RegExp(`^/(${locales.join('|')})`),
          ''
        );
        // Allow public routes without token
        const publicRoutes = [
          '/auth/login',
          '/auth/register',
          '/auth/forgot-password',
          '/auth/reset-password',
          '/auth/error'
        ];
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
     '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
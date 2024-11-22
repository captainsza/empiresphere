/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define the routes that require authentication
const PROTECTED_ROUTES = [
  '/',
  '/profile',
  '/settings',
  '/api/protected'
];

// Define the routes that should redirect authenticated users
const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password'
];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Check if the route is an API route
  const isApiRoute = path.startsWith('/api');

  // Handle authentication for protected routes
  if (PROTECTED_ROUTES.some(route => path.startsWith(route))) {
    // Redirect to login if no token exists
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle authentication for auth routes
  if (AUTH_ROUTES.includes(path)) {
    // Redirect authenticated users away from login/register pages
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // API route protection
  if (isApiRoute) {
    // Check if the API route requires authentication
    const protectedApiRoutes = [
      '/api/user',
      '/api/files',
      '/api/settings'
    ];

    if (protectedApiRoutes.some(route => path.startsWith(route))) {
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' }, 
          { status: 401 }
        );
      }
    }
  }

  // Role-based access control example
  if (path.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Hypothetical role check (you'd implement this based on your user model)
    // const userRole = token.role;
    // if (userRole !== 'ADMIN') {
    //   return NextResponse.redirect(new URL('/unauthorized', req.url));
    // }
  }

  // Rate limiting for login attempts (basic implementation)
  if (path === '/api/auth/callback/credentials') {

    // Implement rate limiting logic here
    // This could involve using Redis or an in-memory store
  }

  // Continue with the request if no redirects are triggered
  return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    // Authentication routes
    '/login',
    '/register',
    '/dashboard/:path*',
    '/:path*',
    '/settings/:path*',
    '/admin/:path*',
    
    // Protected API routes
    '/api/user/:path*',
    '/api/files/:path*',
    '/api/settings/:path*'
  ]
};
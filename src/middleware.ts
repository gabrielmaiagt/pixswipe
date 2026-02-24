// ===========================
// Next.js Middleware — Auth + Entitlement Guards
// ===========================

import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/app'];
const ADMIN_ROUTES = ['/admin'];
const AUTH_ROUTES = ['/login', '/cadastro'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get the auth token from cookies (set by Firebase Auth on client)
    const token = request.cookies.get('__session')?.value;

    // Check if accessing protected routes without auth
    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
        pathname.startsWith(route)
    );
    const isAdminRoute = ADMIN_ROUTES.some((route) =>
        pathname.startsWith(route)
    );
    const isAuthRoute = AUTH_ROUTES.some((route) =>
        pathname.startsWith(route)
    );

    // If no token and trying to access protected route → redirect to login
    if ((isProtectedRoute || isAdminRoute) && !token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If logged in and trying to access auth routes → redirect to dashboard
    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL('/app', request.url));
    }

    // Note: Full entitlement and role checks happen in the page/layout
    // server components using Firebase Admin SDK, because Next.js
    // middleware can't directly call Firebase Admin SDK efficiently.
    // The middleware only checks for token presence.

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/app/:path*',
        '/admin/:path*',
        '/login',
        '/cadastro',
    ],
};

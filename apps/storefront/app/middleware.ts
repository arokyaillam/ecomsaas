import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];

  // Extract store domain from subdomain
  // e.g., "arokyastore.localhost:5173" -> "arokyastore"
  // e.g., "store.example.com" -> "store"
  let storeDomain = hostname;

  // Remove port if present
  storeDomain = storeDomain.split(':')[0];

  // Extract subdomain part (before the first dot that's not localhost)
  // This handles both "arokyastore.localhost" and "arokyastore.localhost:5173"
  if (storeDomain.includes('.')) {
    const parts = storeDomain.split('.');
    // If first part is "www", skip it
    if (parts[0] === 'www' && parts.length > 2) {
      storeDomain = parts[1];
    } else if (parts.length >= 2) {
      // Take the first part as the store domain
      // e.g., "arokyastore.localhost" -> "arokyastore"
      storeDomain = parts[0];
    }
  }

  // SECURITY FIX: Removed query parameter override - it allowed any user to access any store
  // Only use the actual hostname from the request
  const finalDomain = storeDomain;

  // Store hostname in request headers for server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-store-domain', finalDomain);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};

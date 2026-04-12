import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];

  // SECURITY FIX: Removed query parameter override - it allowed any user to access any store
  // Only use the actual hostname from the request
  const finalDomain = hostname;

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

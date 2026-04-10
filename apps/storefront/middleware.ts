import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];

  // Allow query parameter to override domain for testing
  const url = new URL(request.url);
  const domainOverride = url.searchParams.get('domain');
  const finalDomain = domainOverride || hostname;

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

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login', '/setup', '/api/auth', '/api/health'];
const JWT_SECRET = new TextEncoder().encode('personalos-soul-app-dev-secret-change-in-production');
const COOKIE_NAME = 'soul-session';

async function handler(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const proxy = handler;

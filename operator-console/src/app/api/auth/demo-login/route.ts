import { createSession, getSessionCookieName } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  if (process.env.DEMO_MODE !== 'true') {
    return Response.json({ error: 'Demo login disabled' }, { status: 403 });
  }

  const { persona } = await request.json();
  if (persona !== 'admin') {
    return Response.json({ error: 'Unknown persona' }, { status: 400 });
  }

  const token = await createSession('admin@personalos.demo', 'admin');
  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 8 * 3600,
    path: '/',
  });

  return Response.json({ success: true, redirect: '/' }, {
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3003',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3003',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

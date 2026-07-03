import { createSession, getSessionCookieName } from '@/lib/auth';
import { DEMO_SOULS } from '@/lib/synthetic-data';
import { cookies } from 'next/headers';

const PERSONA_MAP: Record<string, string> = {
  priya: 'priya',
  marcus: 'marcus',
};

export async function POST(request: Request) {
  if (process.env.DEMO_MODE !== 'true') {
    return Response.json({ error: 'Demo login disabled' }, { status: 403 });
  }

  const { persona } = await request.json();
  const soulId = PERSONA_MAP[persona];
  if (!soulId) {
    return Response.json({ error: 'Unknown persona' }, { status: 400 });
  }

  const soul = DEMO_SOULS.find(s => s.soulId === soulId);
  if (!soul) {
    return Response.json({ error: 'Soul not found' }, { status: 404 });
  }

  const jwt = await createSession({
    userId: `demo_${persona}`,
    soulId: soul.soulId,
    displayName: soul.displayName,
  });

  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), jwt, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 8 * 3600,
    path: '/',
  });

  return Response.json({ success: true, redirect: '/home' }, {
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

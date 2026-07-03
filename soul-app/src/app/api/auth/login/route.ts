import { NextRequest } from 'next/server';
import { compare } from 'bcryptjs';
import { verifySync } from 'otplib';
import { getUserByEmail } from '@/lib/db';
import { createSession, getSessionCookieName } from '@/lib/auth';
import { DEMO_SOULS } from '@/lib/synthetic-data';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const { email, password, token } = await req.json();
  if (!email || !password || !token) {
    return Response.json({ error: 'All fields required' }, { status: 400 });
  }

  const user = getUserByEmail(email);
  if (!user) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const pwValid = await compare(password, user.password_hash);
  if (!pwValid) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const totpValid = verifySync({ secret: user.totp_secret, token });
  if (!totpValid) {
    return Response.json({ error: 'Invalid TOTP code' }, { status: 401 });
  }

  const soul = DEMO_SOULS.find(s => s.soulId === user.soul_id);
  const jwt = await createSession({ userId: user.id, soulId: user.soul_id, displayName: soul?.displayName || 'Soul' });

  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), jwt, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 8 * 3600,
    path: '/',
  });

  return Response.json({ success: true, displayName: soul?.displayName });
}

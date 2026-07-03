import { NextRequest } from 'next/server';
import { hash } from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { createUser, getUserCount } from '@/lib/db';
import { createSession, getSessionCookieName } from '@/lib/auth';
import { DEMO_SOULS } from '@/lib/synthetic-data';
import { cookies } from 'next/headers';

export async function GET() {
  const count = getUserCount();
  return Response.json({ needsSetup: count === 0 });
}

export async function POST(req: NextRequest) {
  const { email, password, soulId } = await req.json();
  if (!email || !password || !soulId) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  const soul = DEMO_SOULS.find(s => s.soulId === soulId);
  if (!soul) {
    return Response.json({ error: 'Invalid soul' }, { status: 400 });
  }

  const passwordHash = await hash(password, 10);
  const totpSecret = generateSecret();
  const userId = uuid();

  createUser(userId, email, passwordHash, totpSecret, soulId);

  const otherSouls = DEMO_SOULS.filter(s => s.soulId !== soulId);
  for (const other of otherSouls) {
    const otherId = uuid();
    const otherHash = await hash('demo1234', 10);
    const otherSecret = generateSecret();
    try {
      createUser(otherId, other.email, otherHash, otherSecret, other.soulId);
    } catch { /* already exists */ }
  }

  const uri = generateURI({ issuer: 'PersonalOS', label: email, secret: totpSecret });

  return Response.json({ totpSecret, totpUri: uri, soulId, displayName: soul.displayName });
}

export async function PUT(req: NextRequest) {
  const { email, token } = await req.json();
  if (!email || !token) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { getUserByEmail } = await import('@/lib/db');
  const user = getUserByEmail(email);
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const valid = verifySync({ secret: user.totp_secret, token });
  if (!valid) {
    return Response.json({ error: 'Invalid TOTP' }, { status: 401 });
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

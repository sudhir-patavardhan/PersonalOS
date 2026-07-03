import { getUserCount, createUser } from '@/lib/db';
import { createSession, getSessionCookieName } from '@/lib/auth';
import { DEMO_BRANDS } from '@/lib/synthetic-data';
import bcrypt from 'bcryptjs';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const count = getUserCount();
  if (count > 0) {
    return Response.json({ error: 'Setup already complete' }, { status: 400 });
  }

  const { email, password, brandId } = await request.json();
  if (!email || !password || password.length < 8) {
    return Response.json({ error: 'Email and password (min 8 chars) required' }, { status: 400 });
  }

  const demoBrand = DEMO_BRANDS.find(b => b.brandId === brandId);
  if (!demoBrand) {
    return Response.json({ error: 'Invalid brand selection' }, { status: 400 });
  }

  const totpSecret = generateSecret();
  const otpauthUrl = generateURI({ secret: totpSecret, issuer: `PersonalOS Brand Portal - ${demoBrand.name}`, label: email });
  const passwordHash = await bcrypt.hash(password, 12);
  createUser(email, passwordHash, totpSecret, brandId, 'admin');

  const otherBrands = DEMO_BRANDS.filter(b => b.brandId !== brandId);
  for (const ob of otherBrands) {
    const obHash = await bcrypt.hash('demo1234', 12);
    const obSecret = generateSecret();
    createUser(ob.email, obHash, obSecret, ob.brandId, 'admin');
  }

  return Response.json({ totpSecret, otpauthUrl, brandName: demoBrand.name });
}

export async function PUT(request: Request) {
  const { email, totpCode } = await request.json();
  if (!email || !totpCode) {
    return Response.json({ error: 'Email and TOTP code required' }, { status: 400 });
  }

  const { getUserByEmail } = await import('@/lib/db');
  const user = getUserByEmail(email);
  if (!user || !user.totpSecret) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const result = verifySync({ secret: user.totpSecret, token: totpCode });
  if (!result.valid) {
    return Response.json({ error: 'Invalid TOTP code. Please try again.' }, { status: 401 });
  }

  const { getBrandData } = await import('@/lib/synthetic-data');
  const brand = getBrandData(user.brandId);
  const token = await createSession(email, user.brandId, brand?.profile.name || 'Unknown', user.role);
  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60,
    path: '/',
  });

  return Response.json({ success: true });
}

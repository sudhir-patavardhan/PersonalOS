import { getUserByEmail } from '@/lib/db';
import { createSession, getSessionCookieName } from '@/lib/auth';
import { getBrandData } from '@/lib/synthetic-data';
import bcrypt from 'bcryptjs';
import { verifySync } from 'otplib';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { email, password, totpCode } = await request.json();
  if (!email || !password || !totpCode) {
    return Response.json({ error: 'All fields required' }, { status: 400 });
  }

  const user = getUserByEmail(email);
  if (!user) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!user.totpSecret) {
    return Response.json({ error: 'TOTP not configured' }, { status: 401 });
  }

  const result = verifySync({ secret: user.totpSecret, token: totpCode });
  if (!result.valid) {
    return Response.json({ error: 'Invalid TOTP code' }, { status: 401 });
  }

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

  return Response.json({ success: true, brandName: brand?.profile.name });
}

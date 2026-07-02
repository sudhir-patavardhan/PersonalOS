import { getOperatorByEmail, addAuditEntry } from '@/lib/db';
import { createSession, getSessionCookieName } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { verifySync } from 'otplib';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { email, password, totpCode } = await request.json();

  if (!email || !password || !totpCode) {
    return Response.json({ error: 'Email, password, and TOTP code required' }, { status: 400 });
  }

  const operator = getOperatorByEmail(email);
  if (!operator) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const passwordValid = await bcrypt.compare(password, operator.passwordHash);
  if (!passwordValid) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!operator.totpSecret) {
    return Response.json({ error: 'TOTP not configured' }, { status: 401 });
  }

  const totpResult = verifySync({ secret: operator.totpSecret, token: totpCode });
  if (!totpResult.valid) {
    return Response.json({ error: 'Invalid TOTP code' }, { status: 401 });
  }

  const token = await createSession(email, operator.role);
  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60,
    path: '/',
  });

  addAuditEntry(email, 'operator.login');
  return Response.json({ success: true, role: operator.role });
}

import { getOperatorCount, createOperator, addAuditEntry } from '@/lib/db';
import { createSession, getSessionCookieName } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const count = getOperatorCount();
  if (count > 0) {
    return Response.json({ error: 'Setup already complete' }, { status: 400 });
  }

  const { email, password } = await request.json();
  if (!email || !password || password.length < 8) {
    return Response.json({ error: 'Email and password (min 8 chars) required' }, { status: 400 });
  }

  const totpSecret = generateSecret();
  const otpauthUrl = generateURI({ secret: totpSecret, issuer: 'PersonalOS Operator Console', label: email });
  const passwordHash = await bcrypt.hash(password, 12);
  createOperator(email, passwordHash, totpSecret);
  addAuditEntry(email, 'operator.setup', 'First operator created');

  return Response.json({ totpSecret, otpauthUrl });
}

export async function PUT(request: Request) {
  const { email, totpCode } = await request.json();
  if (!email || !totpCode) {
    return Response.json({ error: 'Email and TOTP code required' }, { status: 400 });
  }

  const { getOperatorByEmail } = await import('@/lib/db');
  const operator = getOperatorByEmail(email);
  if (!operator || !operator.totpSecret) {
    return Response.json({ error: 'Operator not found' }, { status: 404 });
  }

  const result = verifySync({ secret: operator.totpSecret, token: totpCode });
  if (!result.valid) {
    return Response.json({ error: 'Invalid TOTP code. Please try again.' }, { status: 401 });
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

  addAuditEntry(email, 'operator.login', 'First login after setup');
  return Response.json({ success: true });
}

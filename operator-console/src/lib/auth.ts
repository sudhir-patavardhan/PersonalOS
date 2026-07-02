import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'personalos-operator-console-dev-secret-change-in-production');
const COOKIE_NAME = 'pos-session';
const SESSION_HOURS = 8;

export interface SessionPayload {
  email: string;
  role: 'admin' | 'viewer';
  iat: number;
  exp: number;
}

export async function createSession(email: string, role: 'admin' | 'viewer'): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(SECRET);
  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

interface SessionPayload {
  userId: string;
  soulId: string;
  displayName: string;
  [key: string]: unknown;
}

const JWT_SECRET = new TextEncoder().encode('personalos-soul-app-dev-secret-change-in-production');
const COOKIE_NAME = 'soul-session';

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function getSessionCookieName() { return COOKIE_NAME; }
export function getJwtSecret() { return JWT_SECRET; }

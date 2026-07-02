import { getSession, getSessionCookieName } from '@/lib/auth';
import { addAuditEntry } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST() {
  const session = await getSession();
  if (session) {
    addAuditEntry(session.email, 'operator.logout');
  }
  const cookieStore = await cookies();
  cookieStore.delete(getSessionCookieName());
  return Response.json({ success: true });
}

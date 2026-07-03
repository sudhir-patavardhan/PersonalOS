import { createSession, getSessionCookieName } from '@/lib/auth';
import { getBrandPortalData } from '@/lib/synthetic-data';
import { cookies } from 'next/headers';

const PERSONA_MAP: Record<string, { email: string; brandId: string }> = {
  wholefoods: { email: 'admin@wholefoods.demo', brandId: 'brand_1' },
  chase: { email: 'admin@chase.demo', brandId: 'brand_3' },
};

export async function POST(request: Request) {
  if (process.env.DEMO_MODE !== 'true') {
    return Response.json({ error: 'Demo login disabled' }, { status: 403 });
  }

  const { persona } = await request.json();
  const mapping = PERSONA_MAP[persona];
  if (!mapping) {
    return Response.json({ error: 'Unknown persona' }, { status: 400 });
  }

  const data = getBrandPortalData();
  const brand = data.brands[mapping.brandId];
  const brandName = brand?.profile.name || 'Unknown';

  const token = await createSession(mapping.email, mapping.brandId, brandName, 'admin');
  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 8 * 3600,
    path: '/',
  });

  return Response.json({ success: true, redirect: '/' }, {
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

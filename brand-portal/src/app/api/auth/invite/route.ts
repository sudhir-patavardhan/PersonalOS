import { getSession } from '@/lib/auth';
import { createInviteToken, getInviteToken, markInviteUsed, createUser, getUserByEmail } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateSecret, generateURI, verifySync } from 'otplib';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { role } = await request.json();
  if (!['campaign_manager', 'viewer'].includes(role)) {
    return Response.json({ error: 'Invalid role' }, { status: 400 });
  }

  const token = createInviteToken(session.brandId, role);
  const inviteUrl = `/invite?token=${token}`;
  return Response.json({ inviteUrl, token });
}

export async function PUT(request: Request) {
  const { token, email, password, totpCode, step } = await request.json();

  const invite = getInviteToken(token);
  if (!invite || invite.used || new Date(invite.expiresAt) < new Date()) {
    return Response.json({ error: 'Invalid or expired invite' }, { status: 400 });
  }

  if (step === 'credentials') {
    if (!email || !password || password.length < 8) {
      return Response.json({ error: 'Email and password (min 8 chars) required' }, { status: 400 });
    }
    const existing = getUserByEmail(email);
    if (existing) {
      return Response.json({ error: 'Email already registered' }, { status: 400 });
    }
    const totpSecret = generateSecret();
    const otpauthUrl = generateURI({ secret: totpSecret, issuer: 'PersonalOS Brand Portal', label: email });
    const passwordHash = await bcrypt.hash(password, 12);
    createUser(email, passwordHash, totpSecret, invite.brandId, invite.role);
    return Response.json({ totpSecret, otpauthUrl });
  }

  if (step === 'verify') {
    if (!email || !totpCode) {
      return Response.json({ error: 'Email and TOTP code required' }, { status: 400 });
    }
    const user = getUserByEmail(email);
    if (!user || !user.totpSecret) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const result = verifySync({ secret: user.totpSecret, token: totpCode });
    if (!result.valid) {
      return Response.json({ error: 'Invalid TOTP code' }, { status: 401 });
    }
    markInviteUsed(token);
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Invalid step' }, { status: 400 });
}

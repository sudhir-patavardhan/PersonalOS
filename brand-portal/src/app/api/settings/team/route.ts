import { getSession } from '@/lib/auth';
import { getTeamMembers } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const team = getTeamMembers(session.brandId);
  return Response.json({ team });
}

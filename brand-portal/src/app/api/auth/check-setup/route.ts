import { getUserCount } from '@/lib/db';

export async function GET() {
  const count = getUserCount();
  return Response.json({ needsSetup: count === 0 });
}

import { getOperatorCount } from '@/lib/db';

export async function GET() {
  const count = getOperatorCount();
  return Response.json({ needsSetup: count === 0 });
}

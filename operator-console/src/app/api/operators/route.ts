import { getAllOperators } from '@/lib/db';

export async function GET() {
  const operators = getAllOperators();
  return Response.json({ operators });
}

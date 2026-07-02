import { getAuditLog } from '@/lib/db';

export async function GET() {
  const entries = getAuditLog(200);
  return Response.json({ entries });
}

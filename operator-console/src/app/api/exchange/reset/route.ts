import { resetState } from '@/lib/state';

export async function POST() {
  resetState();
  return Response.json({ success: true, message: 'Exchange state reset' });
}

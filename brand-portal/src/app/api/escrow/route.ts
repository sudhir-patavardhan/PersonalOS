import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role === 'viewer') {
    return Response.json({ error: 'Viewers cannot modify escrow' }, { status: 403 });
  }

  const { action, listingId, amount } = await request.json();

  if (action === 'simulate_deposit') {
    return Response.json({
      success: true,
      message: `Simulated deposit of $${amount} USDC to listing ${listingId}`,
      simulated: true,
    });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}

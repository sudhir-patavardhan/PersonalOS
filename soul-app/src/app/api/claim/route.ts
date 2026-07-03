import { getSession } from '@/lib/auth';
import { claimOffer, readState, writeState } from '@/lib/state';
import { claimOnChain } from '@/lib/contracts/onchain-claim';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { offerId } = await request.json();
  if (!offerId) {
    return Response.json({ error: 'offerId required' }, { status: 400 });
  }

  const result = claimOffer(offerId);

  if ('error' in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  let onChainTx: string | null = null;
  try {
    const onChainResult = await claimOnChain(result.listingId, result.bidUsdc);
    if (onChainResult) {
      onChainTx = onChainResult.txHash;
      const state = readState();
      const settlement = state.settlements.find(s => s.id === result.id);
      if (settlement) {
        settlement.txHash = onChainResult.txHash;
        writeState(state);
      }
    }
  } catch (err) {
    console.error('[claim] On-chain claim failed, JSON settlement preserved:', err);
  }

  return Response.json({
    success: true,
    settlement: { ...result, txHash: onChainTx || result.txHash },
    onChain: !!onChainTx,
  });
}

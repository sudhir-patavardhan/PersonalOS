import { getSession } from '@/lib/auth';
import { createListing } from '@/lib/state';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { category, bid, budget, threshold, headline, bodyText, ctaUrl, ctaLabel } = body;

  if (!category || !bid || !budget || !headline) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const bidNum = parseFloat(bid);
  const budgetNum = parseFloat(budget);
  const thresholdNum = parseInt(threshold) || 40;

  if (bidNum < 0.50) {
    return Response.json({ error: 'Minimum bid is $0.50' }, { status: 400 });
  }
  if (budgetNum < bidNum * 10) {
    return Response.json({ error: 'Budget must be at least 10x bid' }, { status: 400 });
  }

  const listing = createListing({
    brandId: session.brandId,
    brandName: session.brandName || session.brandId,
    category,
    bidPerClaim: bidNum,
    escrowFunded: budgetNum,
    minScoreThreshold: thresholdNum,
    headline,
    body: bodyText || '',
    ctaUrl: ctaUrl || undefined,
    ctaLabel: ctaLabel || undefined,
  });

  return Response.json({ success: true, listing });
}

import { getBrandPortalData } from '@/lib/synthetic-data';

export async function GET() {
  const data = getBrandPortalData();
  const brandIds = Object.keys(data.brands);
  let totalListings = 0;
  let totalEscrowed = 0;
  for (const id of brandIds) {
    const b = data.brands[id];
    totalListings += b.listings.length;
    totalEscrowed += b.listings.reduce((s, l) => s + (l.escrowFundedUsdc || 0), 0);
  }

  return Response.json({
    status: 'ok',
    surface: 'brand-portal',
    port: 3001,
    metrics: {
      brands: brandIds.length,
      listings: totalListings,
      escrowed: totalEscrowed,
    },
  }, {
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3003',
      'Access-Control-Allow-Methods': 'GET',
    },
  });
}

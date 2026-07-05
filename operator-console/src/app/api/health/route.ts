import { getSyntheticData } from '@/lib/synthetic-data';

export async function GET() {
  const data = getSyntheticData();

  const allListings = data.brands.flatMap(b => b.listings);
  const activeListings = allListings.filter(l => l.status === 'active').length;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const claimsToday = data.settlements.filter(s => new Date(s.settledAt) >= todayStart).length;

  return Response.json({
    status: 'ok',
    surface: 'operator-console',
    port: 3000,
    metrics: {
      souls: data.souls.length,
      listings: activeListings,
      claims_today: claimsToday,
    },
  }, {
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3003',
      'Access-Control-Allow-Methods': 'GET',
    },
  });
}

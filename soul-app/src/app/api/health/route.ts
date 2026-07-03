import { DEMO_SOULS, getSoulData } from '@/lib/synthetic-data';

export async function GET() {
  const souls = DEMO_SOULS;
  let maxDepth = 0;
  let totalConsents = 0;
  for (const s of souls) {
    const data = getSoulData(s.soulId);
    if (data) {
      if (data.profile.depthScore > maxDepth) maxDepth = data.profile.depthScore;
      totalConsents += data.consents.length;
    }
  }

  return Response.json({
    status: 'ok',
    surface: 'soul-app',
    port: 3002,
    metrics: {
      souls: souls.length,
      max_depth: `${maxDepth}%`,
      consents: totalConsents,
    },
  }, {
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3003',
      'Access-Control-Allow-Methods': 'GET',
    },
  });
}

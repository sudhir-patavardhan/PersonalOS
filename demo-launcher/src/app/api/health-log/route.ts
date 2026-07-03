import { SURFACES } from '@/lib/surfaces';

export async function GET() {
  const results: Record<string, { online: boolean; metrics?: Record<string, number | string> }> = {};

  for (const s of SURFACES) {
    try {
      const res = await fetch(`http://localhost:${s.port}/api/health`, {
        signal: AbortSignal.timeout(3000),
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        results[s.id] = { online: true, metrics: data.metrics };
        console.log(`[health] ${s.id}:${s.port} ✓`, data.metrics ? JSON.stringify(data.metrics) : '');
      } else {
        results[s.id] = { online: false };
        console.warn(`[health] ${s.id}:${s.port} ✗ (HTTP ${res.status})`);
      }
    } catch {
      results[s.id] = { online: false };
      console.warn(`[health] ${s.id}:${s.port} ✗ (unreachable)`);
    }
  }

  const allOnline = Object.values(results).every(r => r.online);
  console.log(`[health] ${allOnline ? 'All surfaces healthy' : 'Some surfaces offline'}`);

  return Response.json({ results, allOnline });
}

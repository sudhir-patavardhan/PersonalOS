'use client';
import { useEffect, useState, useCallback } from 'react';
import type { ExchangeRun, MatchMetrics, MatchResult, ReachEstimate } from '@/lib/matching';

const C = {
  bg: '#f4f4f5',
  card: '#ffffff',
  border: '#e4e4e7',
  text: '#18181b',
  textMuted: '#71717a',
  textFaint: '#a1a1aa',
  green: '#16a34a',
  greenBg: '#dcfce7',
  amber: '#d97706',
  amberBg: '#fef3c7',
  red: '#dc2626',
  redBg: '#fee2e2',
  blue: '#2563eb',
  blueBg: '#dbeafe',
  purple: '#7c3aed',
  purpleBg: '#ede9fe',
};

interface ExchangeData {
  run: ExchangeRun;
  metrics: MatchMetrics;
  simulation: ReachEstimate | null;
}

function KPICard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
      <p style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 600, color, marginTop: 4 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

function CoverageRow({ item }: { item: MatchMetrics['categoryCoverage'][0] }) {
  const status = item.hasListings && item.hasConsents
    ? 'active' : item.hasListings || item.hasConsents
    ? 'partial' : 'empty';
  const statusColor = status === 'active' ? C.green : status === 'partial' ? C.amber : C.red;
  const statusBg = status === 'active' ? C.greenBg : status === 'partial' ? C.amberBg : C.redBg;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{item.displayName}</span>
        <span style={{ fontSize: 11, color: C.textFaint, marginLeft: 8 }}>{item.category}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: C.textMuted }}>{item.matchCount} matches</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: statusColor, background: statusBg, padding: '2px 8px', borderRadius: 9999 }}>
          {status === 'active' ? 'Both sides' : status === 'partial' ? (item.hasListings ? 'Demand only' : 'Supply only') : 'Empty'}
        </span>
      </div>
    </div>
  );
}

function YieldGapRow({ item }: { item: MatchMetrics['yieldGaps'][0] }) {
  const gapColor = item.gap > 0 ? C.green : item.gap < 0 ? C.red : C.textMuted;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 13, color: C.text, fontWeight: 500, flex: 1 }}>{item.displayName}</span>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: C.blue, minWidth: 60, textAlign: 'right' }}>Bid ${item.avgBid.toFixed(2)}</span>
        <span style={{ fontSize: 12, color: C.purple, minWidth: 70, textAlign: 'right' }}>Floor ${item.avgFloor.toFixed(2)}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: gapColor, minWidth: 70, textAlign: 'right' }}>
          {item.gap > 0 ? '+' : ''}${item.gap.toFixed(2)} gap
        </span>
      </div>
    </div>
  );
}

function MatchRow({ match, rank }: { match: MatchResult; rank: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 11, color: C.textFaint, width: 24, textAlign: 'right' }}>#{rank}</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{match.soulId}</span>
        <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 8 }}>&rarr; {match.brandName}</span>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
        {match.matchedCategories.map(cat => (
          <span key={cat} style={{ fontSize: 10, background: C.blueBg, color: C.blue, padding: '2px 6px', borderRadius: 4 }}>{cat}</span>
        ))}
      </div>
      <span style={{ fontSize: 12, color: C.green, fontWeight: 600, minWidth: 50, textAlign: 'right' }}>{match.compositeScore.toFixed(2)}</span>
    </div>
  );
}

interface LiveData {
  listings: { id: string; brandName: string; category: string; bidPerClaim: number; escrowRemaining: number; escrowFunded: number; status: string; headline: string }[];
  offers: { id: string; soulId: string; brandName: string; category: string; compositeScore: number; status: string }[];
  settlements: { id: string; soulId: string; brandId: string; category: string; bidUsdc: number; yieldUsdc: number; feeUsdc: number; claimedAt: string }[];
  metrics: { totalVolume: number; totalExchangeRuns: number; categoryHeat: Record<string, { offerCount: number; claimCount: number; claimRate: number }> };
}

export default function ExchangePage() {
  const [data, setData] = useState<ExchangeData | null>(null);
  const [live, setLive] = useState<LiveData | null>(null);
  const [simDesc, setSimDesc] = useState('');
  const [simBid, setSimBid] = useState('1.50');
  const [simThreshold, setSimThreshold] = useState('30');
  const [simResult, setSimResult] = useState<ReachEstimate | null>(null);
  const [running, setRunning] = useState(false);
  const [lastRunResult, setLastRunResult] = useState<{ matchCount: number; offersCreated: number; categoriesCovered: number } | null>(null);
  const [resetting, setResetting] = useState(false);

  const loadData = useCallback(() => {
    fetch('/api/exchange').then(r => r.json()).then(d => {
      setData(d);
      if (d.live) setLive(d.live);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRunExchange = useCallback(async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/exchange', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setLastRunResult({ matchCount: result.matchCount, offersCreated: result.offersCreated, categoriesCovered: result.categoriesCovered });
        loadData();
      } else {
        setLastRunResult(null);
        alert(result.error || 'Exchange failed');
      }
    } catch { /* ignore */ }
    setRunning(false);
  }, [loadData]);

  const handleReset = useCallback(async () => {
    if (!confirm('Reset all live exchange state? This clears listings, offers, and settlements.')) return;
    setResetting(true);
    await fetch('/api/exchange/reset', { method: 'POST' });
    setLastRunResult(null);
    loadData();
    setResetting(false);
  }, [loadData]);

  const runSimulation = useCallback(async () => {
    if (!simDesc.trim()) return;
    const params = new URLSearchParams({
      simDescriptor: simDesc,
      simBid: simBid,
      simThreshold: simThreshold,
    });
    const res = await fetch(`/api/exchange?${params}`);
    const result = await res.json();
    setSimResult(result.simulation);
  }, [simDesc, simBid, simThreshold]);

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p style={{ color: C.textMuted }}>Running exchange...</p>
      </div>
    );
  }

  const { run, metrics } = data;
  const activeCats = metrics.categoryCoverage.filter(c => c.hasListings && c.hasConsents).length;
  const totalCats = metrics.categoryCoverage.length;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column' as const, gap: 24, background: C.bg, minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: C.text }}>Exchange</h1>
          <p style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
            Semantic matching engine &middot; {run.totalSouls} souls &times; {run.totalListings} listings &middot; {run.matches.length} matches
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleRunExchange} disabled={running}
            style={{ padding: '8px 20px', background: C.green, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: running ? 0.6 : 1 }}>
            {running ? 'Running...' : 'Run Exchange'}
          </button>
          <button onClick={handleReset} disabled={resetting}
            style={{ padding: '8px 16px', background: '#fff', color: C.red, borderRadius: 8, fontSize: 13, fontWeight: 500, border: `1px solid ${C.border}`, cursor: 'pointer', opacity: resetting ? 0.6 : 1 }}>
            {resetting ? 'Resetting...' : 'Reset'}
          </button>
        </div>
      </div>

      {lastRunResult && (
        <div style={{ background: C.greenBg, border: `1px solid ${C.green}33`, borderRadius: 12, padding: 16, display: 'flex', gap: 32, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>Exchange Complete</span>
          <span style={{ fontSize: 12, color: C.text }}>{lastRunResult.matchCount} matches found</span>
          <span style={{ fontSize: 12, color: C.text }}>{lastRunResult.offersCreated} new offers created</span>
          <span style={{ fontSize: 12, color: C.text }}>{lastRunResult.categoriesCovered} categories covered</span>
        </div>
      )}

      {live && (live.listings.length > 0 || live.settlements.length > 0) && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 12 }}>Live Flow State</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
            <KPICard label="Live Listings" value={String(live.listings.length)} sub={`${live.listings.filter(l => l.status === 'active').length} active`} color={C.blue} />
            <KPICard label="Pending Offers" value={String(live.offers.filter(o => o.status === 'pending').length)} sub={`of ${live.offers.length} total`} color={C.amber} />
            <KPICard label="Settlements" value={String(live.settlements.length)} color={C.green} sub={`$${live.metrics.totalVolume.toFixed(2)} volume`} />
            <KPICard label="Exchange Runs" value={String(live.metrics.totalExchangeRuns)} color={C.purple} />
          </div>
          {live.settlements.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>Recent Settlements</h3>
              {live.settlements.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.green, background: C.greenBg, padding: '2px 6px', borderRadius: 4 }}>LIVE</span>
                    <span style={{ fontSize: 13, color: C.text }}>{s.soulId} &rarr; {s.brandId}</span>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{s.category}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: C.text }}>Bid ${s.bidUsdc.toFixed(2)}</span>
                    <span style={{ fontSize: 12, color: C.green }}>Fee ${s.feeUsdc.toFixed(2)}</span>
                    <span style={{ fontSize: 11, color: C.textFaint }}>{new Date(s.claimedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KPICard label="Match Rate" value={`${run.matchRate}%`} sub={`${run.matches.length} of ${run.totalSouls * run.totalListings} pairs`} color={run.matchRate > 15 ? C.green : run.matchRate > 5 ? C.amber : C.red} />
        <KPICard label="Total Matches" value={String(run.matches.length)} sub="Eligible soul–listing pairs" color={C.blue} />
        <KPICard label="Category Coverage" value={`${activeCats}/${totalCats}`} sub="Categories with both supply & demand" color={activeCats > totalCats * 0.5 ? C.green : C.amber} />
        <KPICard label="Avg Composite" value={run.matches.length > 0 ? (run.matches.reduce((s, m) => s + m.compositeScore, 0) / run.matches.length).toFixed(2) : '—'} sub="bid × reputation × recency" color={C.purple} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 12 }}>Category Coverage</h2>
          {metrics.categoryCoverage
            .sort((a, b) => b.matchCount - a.matchCount)
            .map(item => <CoverageRow key={item.category} item={item} />)}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 12 }}>Yield Gaps</h2>
          <p style={{ fontSize: 11, color: C.textFaint, marginBottom: 8 }}>Positive gap = brand bids exceed soul floors (healthy market)</p>
          {metrics.yieldGaps.map(item => <YieldGapRow key={item.category} item={item} />)}
          {metrics.yieldGaps.length === 0 && (
            <p style={{ fontSize: 13, color: C.textFaint, padding: 16, textAlign: 'center' as const }}>No yield data available</p>
          )}
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>Targeting Simulator</h2>
        <p style={{ fontSize: 11, color: C.textFaint, marginBottom: 16 }}>Test how natural-language targeting resolves against the soul pool</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Targeting descriptor</label>
            <input
              type="text"
              value={simDesc}
              onChange={e => setSimDesc(e.target.value)}
              placeholder='e.g. "fitness enthusiasts who eat out"'
              style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}
              onKeyDown={e => e.key === 'Enter' && runSimulation()}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Bid (USDC)</label>
            <input
              type="number"
              value={simBid}
              onChange={e => setSimBid(e.target.value)}
              style={{ width: 80, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Min score</label>
            <input
              type="number"
              value={simThreshold}
              onChange={e => setSimThreshold(e.target.value)}
              style={{ width: 80, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}
            />
          </div>
          <button
            onClick={runSimulation}
            style={{ padding: '8px 20px', background: C.blue, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer' }}
          >
            Simulate
          </button>
        </div>

        {simResult && (
          <div style={{ marginTop: 16, padding: 16, background: C.bg, borderRadius: 8 }}>
            <div style={{ display: 'flex', gap: 32, marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 11, color: C.textMuted }}>Eligible souls</p>
                <p style={{ fontSize: 20, fontWeight: 600, color: C.text }}>{simResult.eligibleSouls} / {simResult.totalSouls}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: C.textMuted }}>Match rate</p>
                <p style={{ fontSize: 20, fontWeight: 600, color: simResult.matchRate > 30 ? C.green : C.amber }}>{simResult.matchRate}%</p>
              </div>
            </div>
            {simResult.categoryBreakdown.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>Resolved categories</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                  {simResult.categoryBreakdown.map(cb => (
                    <span key={cb.category} style={{ fontSize: 12, background: C.blueBg, color: C.blue, padding: '4px 10px', borderRadius: 6 }}>
                      {cb.displayName} ({cb.souls})
                    </span>
                  ))}
                </div>
              </div>
            )}
            {simResult.categoryBreakdown.length === 0 && (
              <p style={{ fontSize: 13, color: C.red }}>No categories matched. Try terms like &quot;groceries&quot;, &quot;fitness&quot;, &quot;travel&quot;, or &quot;streaming&quot;.</p>
            )}
          </div>
        )}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>Top Matches</h2>
        <p style={{ fontSize: 11, color: C.textFaint, marginBottom: 12 }}>Ranked by composite score (bid &times; reputation &times; recency weight)</p>
        {metrics.topMatches.map((match, i) => (
          <MatchRow key={`${match.soulId}-${match.listingId}`} match={match} rank={i + 1} />
        ))}
        {metrics.topMatches.length === 0 && (
          <p style={{ fontSize: 13, color: C.textFaint, padding: 16, textAlign: 'center' as const }}>No matches in this exchange run</p>
        )}
      </div>
    </div>
  );
}

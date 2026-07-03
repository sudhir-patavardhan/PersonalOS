'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SURFACES, NARRATIVE_STEPS } from '@/lib/surfaces';

const C = {
  bg: '#f0f0f5',
  card: '#ffffff',
  border: '#d4d4d8',
  text: '#09090b',
  textSub: '#3f3f46',
  textMuted: '#71717a',
  textFaint: '#a1a1aa',
  btnBg: '#18181b',
  btnText: '#ffffff',
  cardBg: '#f4f4f5',
};

interface HealthData {
  status: string;
  surface: string;
  metrics?: Record<string, number | string>;
}

function useHealthChecks() {
  const [health, setHealth] = useState<Record<string, HealthData | null>>({});

  useEffect(() => {
    async function check() {
      const results: Record<string, HealthData | null> = {};
      for (const s of SURFACES) {
        try {
          const res = await fetch(`http://localhost:${s.port}/api/health`, { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            results[s.id] = await res.json();
          } else {
            results[s.id] = null;
          }
        } catch {
          results[s.id] = null;
        }
      }
      setHealth(results);
    }
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return health;
}

function Hero() {
  return (
    <section className="pt-20 pb-16 px-6 text-center max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: C.textMuted }}>PersonalOS L0.3 Demo</p>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.1]" style={{ color: C.text }}>
          Own your data.<br />
          <span style={{ background: 'linear-gradient(to right, #8b5cf6, #3b82f6, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Earn from it.
          </span>
        </h1>
        <p className="mt-6 text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: C.textSub }}>
          PersonalOS gives individuals ownership, control, and economic benefit from their personal data.
          Brands bid to reach people with relevant insights — Souls earn USDC for every engagement.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a href="#surfaces" className="px-6 py-3 rounded-xl font-semibold text-sm transition-colors" style={{ background: C.btnBg, color: C.btnText }}>
            Explore Surfaces
          </a>
          <a href="#narrative" className="px-6 py-3 rounded-xl font-semibold text-sm transition-colors" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textSub }}>
            Follow the Money →
          </a>
        </div>
      </motion.div>
    </section>
  );
}

function FlowDiagram() {
  const nodes = [
    { label: 'Soul', sub: 'Connects data sources', color: '#8b5cf6', x: 50, y: 50 },
    { label: 'Konnection', sub: 'Plaid, Apple Health, etc.', color: '#8b5cf6', x: 200, y: 50 },
    { label: 'Insight', sub: 'On-device scoring', color: '#8b5cf6', x: 350, y: 50 },
    { label: 'Exchange', sub: 'Privacy-preserving match', color: '#f59e0b', x: 500, y: 50 },
    { label: 'Offer', sub: 'Soul framing', color: '#8b5cf6', x: 650, y: 50 },
    { label: 'Claim', sub: 'Passkey signed', color: '#f59e0b', x: 500, y: 160 },
    { label: 'Yield', sub: 'USDC on Base', color: '#22c55e', x: 350, y: 160 },
  ];

  const edges = [
    { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
    { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 6 },
  ];

  return (
    <section className="py-12 px-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-center text-sm font-semibold tracking-widest uppercase mb-8" style={{ color: C.textMuted }}>How Data Flows</h2>
        <div className="overflow-x-auto">
          <svg viewBox="0 0 750 220" className="w-full max-w-3xl mx-auto" style={{ minWidth: 600 }}>
            {edges.map((e, i) => {
              const from = nodes[e.from];
              const to = nodes[e.to];
              return (
                <line
                  key={i}
                  x1={from.x + 50} y1={from.y + 20}
                  x2={to.x + 50} y2={to.y + 20}
                  stroke={C.border}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                />
              );
            })}
            {nodes.map((node, i) => (
              <g key={i}>
                <rect
                  x={node.x} y={node.y}
                  width={100} height={40}
                  rx={10}
                  fill="white"
                  stroke={node.color}
                  strokeWidth={2}
                />
                <text x={node.x + 50} y={node.y + 18} textAnchor="middle" fontSize={12} fontWeight={700} fill={node.color}>
                  {node.label}
                </text>
                <text x={node.x + 50} y={node.y + 32} textAnchor="middle" fontSize={8} fill={C.textMuted}>
                  {node.sub}
                </text>
              </g>
            ))}
            <motion.circle
              r={4}
              fill="#8b5cf6"
              animate={{
                opacity: [0, 1, 1, 0],
                cx: [100, 250, 400, 550],
                cy: [70, 70, 70, 70],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </svg>
        </div>
      </motion.div>
    </section>
  );
}

function SurfaceCards() {
  const health = useHealthChecks();

  return (
    <section id="surfaces" className="py-16 px-6 max-w-6xl mx-auto">
      <h2 className="text-center text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: C.textMuted }}>Three Surfaces, One Platform</h2>
      <p className="text-center mb-10 max-w-xl mx-auto" style={{ color: C.textSub }}>Each surface serves a different participant in the PersonalOS marketplace</p>

      <div className="grid md:grid-cols-3 gap-6">
        {SURFACES.map((s, i) => {
          const h = health[s.id];
          const online = h !== null && h !== undefined;
          const metrics = h?.metrics;

          return (
            <motion.div
              key={s.id}
              className="rounded-2xl p-6"
              style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: `3px solid ${s.accentColor}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{s.icon}</span>
                <div className="flex items-center gap-2">
                  <span className="status-dot" style={{ background: online ? '#22c55e' : '#ef4444', boxShadow: online ? '0 0 6px rgba(34,197,94,0.5)' : '0 0 6px rgba(239,68,68,0.3)' }} />
                  <span className="text-xs" style={{ color: C.textFaint }}>:{s.port}</span>
                </div>
              </div>

              <h3 className="text-lg font-bold" style={{ color: C.text }}>{s.name}</h3>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: C.textSub }}>{s.description}</p>

              <div className="mt-4 p-3 rounded-lg" style={{ background: C.cardBg }}>
                <p className="text-xs font-medium mb-1" style={{ color: C.textSub }}>Demo as: {s.persona}</p>
                <p className="text-[11px] font-mono" style={{ color: C.textMuted }}>{s.loginHint}</p>
              </div>

              {online && metrics && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {Object.entries(metrics).slice(0, 3).map(([k, v]) => (
                    <div key={k} className="text-center p-2 rounded-lg" style={{ background: C.cardBg }}>
                      <p className="text-sm font-bold" style={{ color: C.text }}>{typeof v === 'number' && v > 999 ? `$${(v / 1000).toFixed(0)}K` : v}</p>
                      <p className="text-[9px] capitalize" style={{ color: C.textMuted }}>{k.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <a
                  href={`http://localhost:${s.port}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 text-center text-sm font-medium rounded-xl transition-colors"
                  style={{ background: s.accentColor + '20', color: s.accentColor }}
                >
                  Open
                </a>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:${s.port}/api/auth/demo-login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ persona: s.demoPersona }),
                        credentials: 'include',
                      });
                      if (res.ok) {
                        const data = await res.json();
                        window.open(`http://localhost:${s.port}${data.redirect || '/'}`, '_blank');
                      }
                    } catch { /* surface offline */ }
                  }}
                  className="flex-1 py-2.5 text-center text-sm font-medium rounded-xl transition-colors"
                  style={{ background: C.btnBg, color: C.btnText }}
                >
                  Quick Launch
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function StepIllustration({ stepIndex, accentColor }: { stepIndex: number; accentColor: string }) {
  const illustrations: Record<number, React.ReactNode> = {
    0: (
      <svg viewBox="0 0 280 200" className="w-full h-full">
        <rect x={0} y={0} width={280} height={200} rx={8} fill="#f8fafc" />
        <rect x={20} y={16} width={240} height={28} rx={6} fill={accentColor + '15'} stroke={accentColor} strokeWidth={1} />
        <text x={140} y={34} textAnchor="middle" fontSize={10} fontWeight={700} fill={accentColor}>Escrow Deposit</text>
        <rect x={20} y={56} width={240} height={60} rx={8} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={36} y={74} fontSize={8} fill="#64748b">Budget</text>
        <text x={36} y={90} fontSize={16} fontWeight={800} fill="#0f172a">$5,000.00</text>
        <text x={36} y={106} fontSize={8} fill="#22c55e">● USDC on Base</text>
        <rect x={180} y={64} width={68} height={44} rx={6} fill="#22c55e15" />
        <text x={214} y={82} textAnchor="middle" fontSize={8} fill="#22c55e">Locked</text>
        <text x={214} y={98} textAnchor="middle" fontSize={10} fontWeight={700} fill="#22c55e">✓</text>
        <rect x={20} y={128} width={112} height={52} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={36} y={146} fontSize={8} fill="#64748b">Category</text>
        <text x={36} y={162} fontSize={10} fontWeight={600} fill="#0f172a">🛒 Grocery</text>
        <rect x={148} y={128} width={112} height={52} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={164} y={146} fontSize={8} fill="#64748b">Bid / Claim</text>
        <text x={164} y={162} fontSize={10} fontWeight={600} fill="#0f172a">$1.50</text>
      </svg>
    ),
    1: (
      <svg viewBox="0 0 280 200" className="w-full h-full">
        <rect x={0} y={0} width={280} height={200} rx={8} fill="#f8fafc" />
        <rect x={20} y={16} width={240} height={28} rx={6} fill={accentColor + '15'} stroke={accentColor} strokeWidth={1} />
        <text x={140} y={34} textAnchor="middle" fontSize={10} fontWeight={700} fill={accentColor}>Exchange Matching</text>
        <rect x={20} y={56} width={74} height={52} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={57} y={74} textAnchor="middle" fontSize={8} fill="#64748b">Eligible</text>
        <text x={57} y={94} textAnchor="middle" fontSize={16} fontWeight={800} fill="#0f172a">847</text>
        <rect x={103} y={56} width={74} height={52} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={140} y={74} textAnchor="middle" fontSize={8} fill="#64748b">Match Rate</text>
        <text x={140} y={94} textAnchor="middle" fontSize={16} fontWeight={800} fill="#0f172a">17.9%</text>
        <rect x={186} y={56} width={74} height={52} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={223} y={74} textAnchor="middle" fontSize={8} fill="#64748b">ε noise</text>
        <text x={223} y={94} textAnchor="middle" fontSize={16} fontWeight={800} fill="#0f172a">1.0</text>
        <rect x={20} y={120} width={240} height={64} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={36} y={138} fontSize={8} fontWeight={600} fill="#64748b">CONSENT CHECK</text>
        {[0,1,2].map(i => (
          <g key={i}>
            <rect x={36} y={144 + i * 12} width={8} height={8} rx={2} fill="#22c55e" />
            <text x={50} y={151 + i * 12} fontSize={7} fill="#0f172a">{['dining.grocery — 847 Souls consented', 'Depth ≥ 40% threshold met', 'Noisy scores transmitted (ε = 1.0)'][i]}</text>
          </g>
        ))}
      </svg>
    ),
    2: (
      <svg viewBox="0 0 280 200" className="w-full h-full">
        <rect x={0} y={0} width={280} height={200} rx={8} fill="#f8fafc" />
        <rect x={20} y={16} width={240} height={28} rx={6} fill={accentColor + '15'} stroke={accentColor} strokeWidth={1} />
        <text x={140} y={34} textAnchor="middle" fontSize={10} fontWeight={700} fill={accentColor}>Offers Feed</text>
        <rect x={20} y={56} width={240} height={72} rx={8} fill="white" stroke={accentColor} strokeWidth={1.5} />
        <text x={36} y={74} fontSize={8} fill={accentColor} fontWeight={600}>NEW OFFER</text>
        <text x={36} y={90} fontSize={10} fontWeight={700} fill="#0f172a">🛒 Fresh organic groceries</text>
        <text x={36} y={104} fontSize={8} fill="#64748b">Whole Foods Market · Grocery Patterns</text>
        <rect x={190} y={62} width={60} height={24} rx={12} fill={accentColor} />
        <text x={220} y={78} textAnchor="middle" fontSize={9} fontWeight={600} fill="white">$1.28</text>
        <rect x={190} y={96} width={60} height={22} rx={6} fill={accentColor + '15'} />
        <text x={220} y={111} textAnchor="middle" fontSize={8} fontWeight={600} fill={accentColor}>Claim →</text>
        <rect x={20} y={140} width={240} height={44} rx={8} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={36} y={158} fontSize={8} fill="#94a3b8">PREVIOUS</text>
        <text x={36} y={172} fontSize={9} fill="#64748b">🍜 Thai cuisine deals — Claimed · +$0.85</text>
      </svg>
    ),
    3: (
      <svg viewBox="0 0 280 200" className="w-full h-full">
        <rect x={0} y={0} width={280} height={200} rx={8} fill="#f8fafc" />
        <rect x={20} y={16} width={240} height={28} rx={6} fill={accentColor + '15'} stroke={accentColor} strokeWidth={1} />
        <text x={140} y={34} textAnchor="middle" fontSize={10} fontWeight={700} fill={accentColor}>Claim Settlement</text>
        <rect x={60} y={56} width={160} height={36} rx={18} fill={accentColor} />
        <text x={140} y={78} textAnchor="middle" fontSize={11} fontWeight={700} fill="white">✓ Claimed</text>
        <rect x={20} y={104} width={240} height={80} rx={8} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={36} y={122} fontSize={8} fontWeight={600} fill="#64748b">SETTLEMENT BREAKDOWN</text>
        <line x1={36} y1={130} x2={244} y2={130} stroke="#e2e8f0" strokeWidth={1} />
        <text x={36} y={146} fontSize={9} fill="#0f172a">Escrow draw</text>
        <text x={244} y={146} textAnchor="end" fontSize={9} fontWeight={600} fill="#0f172a">$1.50</text>
        <text x={36} y={162} fontSize={9} fill="#22c55e">→ Soul yield (85%)</text>
        <text x={244} y={162} textAnchor="end" fontSize={9} fontWeight={600} fill="#22c55e">$1.28</text>
        <text x={36} y={178} fontSize={9} fill="#f59e0b">→ Platform fee (15%)</text>
        <text x={244} y={178} textAnchor="end" fontSize={9} fontWeight={600} fill="#f59e0b">$0.22</text>
      </svg>
    ),
    4: (
      <svg viewBox="0 0 280 200" className="w-full h-full">
        <rect x={0} y={0} width={280} height={200} rx={8} fill="#f8fafc" />
        <rect x={20} y={16} width={240} height={28} rx={6} fill={accentColor + '15'} stroke={accentColor} strokeWidth={1} />
        <text x={140} y={34} textAnchor="middle" fontSize={10} fontWeight={700} fill={accentColor}>Platform Revenue</text>
        <rect x={20} y={56} width={116} height={52} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={78} y={74} textAnchor="middle" fontSize={8} fill="#64748b">Revenue (7d)</text>
        <text x={78} y={94} textAnchor="middle" fontSize={16} fontWeight={800} fill="#0f172a">$32.41</text>
        <rect x={144} y={56} width={116} height={52} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={202} y={74} textAnchor="middle" fontSize={8} fill="#64748b">Take Rate</text>
        <text x={202} y={94} textAnchor="middle" fontSize={16} fontWeight={800} fill={accentColor}>15%</text>
        <rect x={20} y={120} width={240} height={64} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={36} y={138} fontSize={8} fontWeight={600} fill="#64748b">RECENT CLAIM</text>
        <text x={36} y={154} fontSize={9} fill="#0f172a">Whole Foods · dining.grocery</text>
        <text x={36} y={168} fontSize={8} fill="#64748b">$1.50 bid → $0.22 fee · 0x4a4f...</text>
        <circle cx={244} cy={154} r={10} fill="#22c55e20" />
        <text x={244} y={158} textAnchor="middle" fontSize={10} fill="#22c55e">✓</text>
      </svg>
    ),
    5: (
      <svg viewBox="0 0 280 200" className="w-full h-full">
        <rect x={0} y={0} width={280} height={200} rx={8} fill="#f8fafc" />
        <rect x={20} y={16} width={240} height={28} rx={6} fill={accentColor + '15'} stroke={accentColor} strokeWidth={1} />
        <text x={140} y={34} textAnchor="middle" fontSize={10} fontWeight={700} fill={accentColor}>Campaign Dashboard</text>
        <rect x={20} y={56} width={116} height={52} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={78} y={74} textAnchor="middle" fontSize={8} fill="#64748b">Budget Left</text>
        <text x={78} y={94} textAnchor="middle" fontSize={14} fontWeight={800} fill="#0f172a">$4,998.50</text>
        <rect x={144} y={56} width={116} height={52} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={202} y={74} textAnchor="middle" fontSize={8} fill="#64748b">Claims</text>
        <text x={202} y={94} textAnchor="middle" fontSize={16} fontWeight={800} fill="#0f172a">5</text>
        <rect x={20} y={120} width={240} height={14} rx={3} fill="#e2e8f0" />
        <rect x={20} y={120} width={239} height={14} rx={3} fill={accentColor + '30'} />
        <text x={140} y={130} textAnchor="middle" fontSize={7} fontWeight={600} fill={accentColor}>99.97% budget remaining</text>
        <rect x={20} y={146} width={240} height={38} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={36} y={162} fontSize={8} fill="#64748b">Avg Cost/Claim</text>
        <text x={180} y={162} fontSize={10} fontWeight={700} fill="#0f172a">$1.60</text>
        <text x={220} y={162} fontSize={8} fill="#22c55e">efficient</text>
      </svg>
    ),
    6: (
      <svg viewBox="0 0 280 200" className="w-full h-full">
        <rect x={0} y={0} width={280} height={200} rx={8} fill="#f8fafc" />
        <rect x={20} y={16} width={240} height={28} rx={6} fill={accentColor + '15'} stroke={accentColor} strokeWidth={1} />
        <text x={140} y={34} textAnchor="middle" fontSize={10} fontWeight={700} fill={accentColor}>Soul Wallet</text>
        <rect x={60} y={52} width={160} height={56} rx={12} fill={accentColor + '10'} stroke={accentColor} strokeWidth={1} />
        <text x={140} y={72} textAnchor="middle" fontSize={8} fill={accentColor}>Total Balance</text>
        <text x={140} y={96} textAnchor="middle" fontSize={22} fontWeight={800} fill="#0f172a">$48.81</text>
        <rect x={20} y={120} width={240} height={64} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1} />
        <text x={36} y={138} fontSize={8} fontWeight={600} fill="#64748b">LATEST TRANSACTION</text>
        <text x={36} y={154} fontSize={9} fill="#22c55e" fontWeight={600}>+ $1.28 USDC</text>
        <text x={36} y={168} fontSize={8} fill="#64748b">Whole Foods · 0x4a4fefd7...</text>
        <text x={244} y={154} textAnchor="end" fontSize={8} fill="#64748b">Just now</text>
        <circle cx={244} cy={168} r={8} fill="#22c55e20" />
        <text x={244} y={172} textAnchor="middle" fontSize={8} fill="#22c55e">⛓</text>
      </svg>
    ),
  };

  return (
    <div className="rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center" style={{ background: '#f8fafc', border: `1px solid ${C.border}` }}>
      {illustrations[stepIndex] || null}
    </div>
  );
}

function FollowTheMoney() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = NARRATIVE_STEPS[currentStep];

  return (
    <section id="narrative" className="py-16 px-6 max-w-4xl mx-auto">
      <h2 className="text-center text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: C.textMuted }}>Follow the Money</h2>
      <p className="text-center mb-10 max-w-xl mx-auto" style={{ color: C.textSub }}>
        Trace a single Whole Foods campaign from funding to Soul earnings in 7 steps
      </p>

      <div className="flex justify-center gap-2 mb-8">
        {NARRATIVE_STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className="w-9 h-9 rounded-full text-sm font-semibold transition-all"
            style={{
              background: i === currentStep ? s.accentColor : C.cardBg,
              color: i === currentStep ? 'white' : C.textMuted,
              transform: i === currentStep ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <div className="px-4 py-3" style={{ background: step.accentColor }}>
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-semibold">{step.surface}</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Step {step.step} of 7</span>
          </div>
        </div>

        <div className="p-8 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-xl font-bold mb-3" style={{ color: C.text }}>{step.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{step.description}</p>
            <div className="mt-6 inline-flex flex-col items-center p-4 rounded-xl" style={{ background: C.cardBg }}>
              <span className="key-number">{step.keyNumber}</span>
              <span className="text-xs mt-1" style={{ color: C.textMuted }}>{step.keyLabel}</span>
            </div>
          </div>

          <StepIllustration stepIndex={currentStep} accentColor={step.accentColor} />
        </div>
      </motion.div>

      <div className="flex justify-between mt-6">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-5 py-2.5 text-sm font-medium rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textSub }}
        >
          ← Previous
        </button>
        <button
          onClick={() => setCurrentStep(Math.min(NARRATIVE_STEPS.length - 1, currentStep + 1))}
          disabled={currentStep === NARRATIVE_STEPS.length - 1}
          className="px-5 py-2.5 text-sm font-medium rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          style={{ background: C.btnBg, color: C.btnText }}
        >
          Next →
        </button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6" style={{ borderTop: `1px solid ${C.border}` }}>
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold" style={{ color: C.text }}>PersonalOS</p>
          <p className="text-xs mt-1" style={{ color: C.textMuted }}>L0.3 Synthetic Demo · All data is simulated</p>
        </div>
        <div className="flex gap-6">
          <Link href="/architecture" className="text-xs transition-colors" style={{ color: C.textMuted }}>
            Architecture
          </Link>
          <span className="text-xs" style={{ color: C.textFaint }}>|</span>
          <span className="text-xs" style={{ color: C.textMuted }}>
            Operator :3000 · Brand :3001 · Soul :3002
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function LauncherHome() {
  return (
    <main className="min-h-screen" style={{ background: C.bg }}>
      <Hero />
      <FlowDiagram />
      <SurfaceCards />
      <FollowTheMoney />
      <Footer />
    </main>
  );
}

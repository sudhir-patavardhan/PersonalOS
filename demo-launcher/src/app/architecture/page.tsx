'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const C = {
  bg: '#f0f0f5',
  card: '#ffffff',
  border: '#d4d4d8',
  text: '#09090b',
  textSub: '#3f3f46',
  textMuted: '#71717a',
  textFaint: '#a1a1aa',
  cardBg: '#f4f4f5',
};

const sections = [
  {
    title: 'System Architecture',
    content: [
      'Three independent Next.js 16 apps, each with its own SQLite database and synthetic data seed',
      'No shared backend — surfaces are intentionally decoupled to match the production privacy boundary',
      'Each surface generates deterministic synthetic data from a seeded PRNG, ensuring consistent cross-surface narratives',
      'Same 5 brands (Whole Foods, Chase, REI, Spotify, Coursera) appear in all three surfaces with identical creative',
    ],
  },
  {
    title: 'Privacy Architecture',
    content: [
      'On-device scoring — raw Transaktions never leave the Soul\'s device',
      'Differential privacy — Exchange sees noisy Insight scores (ε = 1.0), not actual values',
      'Consent-gated matching — Exchange can only match categories the Soul has explicitly opted into',
      'Brand blindness — Brands see aggregate claim rates, never individual Soul identities',
      'Passkey-anchored identity — no passwords stored server-side in production; TOTP is the L0.3 stand-in',
    ],
  },
  {
    title: 'Settlement Flow',
    content: [
      'Brands deposit USDC into BudgetEscrow.sol on Base (Coinbase L2)',
      'On Claim: atomic on-chain split — 15% platform fee + 85% Soul Yield',
      'Settlement confirms in ~2 seconds; app shows optimistic UI',
      'Soul wallets are Coinbase Smart Wallets — non-custodial, passkey-secured, exportable',
      'L0.3 uses simulated escrow; L0.4 targets real Base Sepolia integration',
    ],
  },
  {
    title: 'Roadmap',
    items: [
      { phase: 'L0.3', label: 'Synthetic Demo', description: 'Three surfaces with linked synthetic data, real TOTP auth, demo escrow', status: 'current' },
      { phase: 'L0.4', label: 'Base Sepolia', description: 'Real WalletConnect integration, testnet USDC, BudgetEscrow.sol deployment', status: 'next' },
      { phase: 'L0.5', label: 'Plaid Integration', description: 'Real Konnection via Plaid sandbox, on-device scoring prototype', status: 'planned' },
      { phase: 'L1.0', label: 'Production', description: 'Mainnet Base, real USDC, passkey identity, Arweave Ledger', status: 'planned' },
    ],
  },
];

const statusStyles: Record<string, { bg: string; color: string }> = {
  current: { bg: '#dcfce7', color: '#15803d' },
  next: { bg: '#fef3c7', color: '#b45309' },
  planned: { bg: '#f4f4f5', color: '#71717a' },
};

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen py-16 px-6" style={{ background: C.bg }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm transition-colors" style={{ color: C.textFaint }}>
          ← Back to Demo
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-black mt-6 mb-2" style={{ color: C.text }}>Architecture</h1>
          <p className="mb-12" style={{ color: C.textMuted }}>How PersonalOS works under the hood</p>

          {/* System Diagram */}
          <div className="rounded-2xl p-6 mb-8" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h2 className="text-sm font-semibold tracking-widest uppercase mb-6" style={{ color: C.textFaint }}>System Diagram</h2>
            <svg viewBox="0 0 700 300" className="w-full">
              {/* Soul App */}
              <rect x={20} y={20} width={180} height={100} rx={12} fill="#8b5cf620" stroke="#8b5cf6" strokeWidth={2} />
              <text x={110} y={50} textAnchor="middle" fontSize={13} fontWeight={700} fill="#8b5cf6">Soul App :3002</text>
              <text x={110} y={70} textAnchor="middle" fontSize={9} fill={C.textMuted}>Next.js 16 + SQLite</text>
              <text x={110} y={85} textAnchor="middle" fontSize={9} fill={C.textMuted}>On-device scoring</text>
              <text x={110} y={100} textAnchor="middle" fontSize={9} fill={C.textMuted}>Passkey / TOTP auth</text>

              {/* Exchange / Operator */}
              <rect x={260} y={20} width={180} height={100} rx={12} fill="#f59e0b20" stroke="#f59e0b" strokeWidth={2} />
              <text x={350} y={50} textAnchor="middle" fontSize={13} fontWeight={700} fill="#f59e0b">Operator :3000</text>
              <text x={350} y={70} textAnchor="middle" fontSize={9} fill={C.textMuted}>Next.js 16 + SQLite</text>
              <text x={350} y={85} textAnchor="middle" fontSize={9} fill={C.textMuted}>Exchange matching</text>
              <text x={350} y={100} textAnchor="middle" fontSize={9} fill={C.textMuted}>Revenue analytics</text>

              {/* Brand Portal */}
              <rect x={500} y={20} width={180} height={100} rx={12} fill="#3b82f620" stroke="#3b82f6" strokeWidth={2} />
              <text x={590} y={50} textAnchor="middle" fontSize={13} fontWeight={700} fill="#3b82f6">Brand :3001</text>
              <text x={590} y={70} textAnchor="middle" fontSize={9} fill={C.textMuted}>Next.js 16 + SQLite</text>
              <text x={590} y={85} textAnchor="middle" fontSize={9} fill={C.textMuted}>Campaign management</text>
              <text x={590} y={100} textAnchor="middle" fontSize={9} fill={C.textMuted}>Escrow funding</text>

              {/* Arrows */}
              <defs>
                <marker id="arr" viewBox="0 0 10 10" refX={10} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={C.textFaint} />
                </marker>
              </defs>
              <line x1={200} y1={70} x2={258} y2={70} stroke={C.textFaint} strokeWidth={1.5} markerEnd="url(#arr)" />
              <text x={229} y={63} textAnchor="middle" fontSize={7} fill={C.textFaint}>noisy scores</text>
              <line x1={440} y1={70} x2={498} y2={70} stroke={C.textFaint} strokeWidth={1.5} markerEnd="url(#arr)" />
              <text x={469} y={63} textAnchor="middle" fontSize={7} fill={C.textFaint}>offers</text>

              {/* Base L2 */}
              <rect x={220} y={180} width={260} height={80} rx={12} fill="#22c55e15" stroke="#22c55e" strokeWidth={2} strokeDasharray="6 4" />
              <text x={350} y={210} textAnchor="middle" fontSize={13} fontWeight={700} fill="#22c55e">Base (Coinbase L2)</text>
              <text x={350} y={230} textAnchor="middle" fontSize={9} fill={C.textMuted}>BudgetEscrow.sol · USDC settlement</text>
              <text x={350} y={245} textAnchor="middle" fontSize={9} fill={C.textMuted}>Smart Wallet · Atomic fee split</text>

              {/* Vertical arrows */}
              <line x1={110} y1={120} x2={280} y2={178} stroke="#22c55e" strokeWidth={1.5} markerEnd="url(#arr)" strokeDasharray="4 3" />
              <text x={175} y={155} textAnchor="middle" fontSize={7} fill="#22c55e">yield deposit</text>
              <line x1={590} y1={120} x2={420} y2={178} stroke="#22c55e" strokeWidth={1.5} markerEnd="url(#arr)" strokeDasharray="4 3" />
              <text x={525} y={155} textAnchor="middle" fontSize={7} fill="#22c55e">escrow deposit</text>
            </svg>
          </div>

          {/* Content sections */}
          {sections.map((section, si) => (
            <motion.div
              key={si}
              className="rounded-2xl p-6 mb-6"
              style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.05, duration: 0.3 }}
            >
              <h2 className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: C.textFaint }}>{section.title}</h2>
              {section.content && (
                <ul className="space-y-2">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: C.textSub }}>
                      <span style={{ color: C.border }} className="mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {section.items && (
                <div className="space-y-3">
                  {section.items.map((item, i) => {
                    const st = statusStyles[item.status] || statusStyles.planned;
                    return (
                      <div key={i} className="flex items-start gap-4 p-3 rounded-lg" style={{ background: C.cardBg }}>
                        <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ background: st.bg, color: st.color }}>{item.phase}</span>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: C.text }}>{item.label}</p>
                          <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>{item.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}

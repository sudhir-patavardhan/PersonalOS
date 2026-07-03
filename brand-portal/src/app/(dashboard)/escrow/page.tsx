'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Listing, EscrowTransaction } from '@/lib/types';
import { CATEGORY_DISPLAY_NAMES } from '@/lib/types';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ESCROW_ADDRESS, USDC_ADDRESS, USDC_DECIMALS, basescanTx } from '@/lib/contracts';
import { BUDGET_ESCROW_ABI, ERC20_ABI } from '@/lib/contracts/abis';
import { parseUnits, keccak256, toHex } from 'viem';

export default function EscrowPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [simAmount, setSimAmount] = useState('1000');
  const [simListing, setSimListing] = useState('');
  const [simResult, setSimResult] = useState('');

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setListings(d.listings || []);
      setTransactions(d.escrowTransactions || []);
      if (d.listings?.length > 0) setSimListing(d.listings[0].id);
      setLoading(false);
    });
  }, []);

  const { address, isConnected } = useAccount();
  const [txStep, setTxStep] = useState<'idle' | 'approving' | 'depositing' | 'confirmed'>('idle');

  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeDeposit, data: depositHash } = useWriteContract();

  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isSuccess: depositConfirmed } = useWaitForTransactionReceipt({ hash: depositHash });

  useEffect(() => {
    if (approveConfirmed && txStep === 'approving') {
      setTxStep('depositing');
      const amount = parseUnits(simAmount, USDC_DECIMALS);
      const listingHash = keccak256(toHex(simListing));
      writeDeposit({
        address: ESCROW_ADDRESS,
        abi: BUDGET_ESCROW_ABI,
        functionName: 'deposit',
        args: [listingHash, amount],
      });
    }
  }, [approveConfirmed, txStep]);

  useEffect(() => {
    if (depositConfirmed && txStep === 'depositing') {
      setTxStep('confirmed');
      setSimResult(`Deposited $${simAmount} USDC on-chain!`);
      fetch('/api/data').then(r => r.json()).then(d => {
        setListings(d.listings || []);
        setTransactions(d.escrowTransactions || []);
      });
    }
  }, [depositConfirmed, txStep]);

  function handleOnChainDeposit() {
    if (!isConnected) return;
    setTxStep('approving');
    setSimResult('');
    const amount = parseUnits(simAmount, USDC_DECIMALS);
    writeApprove({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ESCROW_ADDRESS, amount],
    });
  }

  async function handleSimDeposit() {
    const res = await fetch('/api/escrow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'simulate_deposit', listingId: simListing, amount: parseFloat(simAmount) }),
    });
    const data = await res.json();
    setSimResult(data.message);
  }

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading...</p></div>;

  const totalFunded = listings.reduce((s, l) => s + l.escrowFundedUsdc, 0);
  const totalRemaining = listings.reduce((s, l) => s + l.escrowRemainingUsdc, 0);
  const totalSpent = totalFunded - totalRemaining;

  const depletionData = listings.map(l => ({
    name: l.headline?.slice(0, 15) || l.category.split('.')[1],
    remaining: l.escrowRemainingUsdc,
    spent: l.escrowFundedUsdc - l.escrowRemainingUsdc,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Escrow Management</h1>
        <p className="text-sm text-zinc-500 mt-1">Fund, monitor, and manage listing budgets</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Funded" value={`$${totalFunded.toLocaleString()}`} />
        <StatCard label="Total Remaining" value={`$${totalRemaining.toLocaleString()}`} />
        <StatCard label="Total Spent" value={`$${totalSpent.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Budget by Listing</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={depletionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Bar dataKey="remaining" fill="#10b981" stackId="a" name="Remaining" />
              <Bar dataKey="spent" fill="#d4d4d8" stackId="a" name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Fund a Listing</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <button className="py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-100" onClick={handleSimDeposit}>
                Simulate Deposit
              </button>
              {isConnected ? (
                <button
                  className="py-3 bg-blue-600 border border-blue-700 rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  onClick={handleOnChainDeposit}
                  disabled={txStep !== 'idle' && txStep !== 'confirmed'}
                >
                  {txStep === 'approving' ? 'Approving...' : txStep === 'depositing' ? 'Depositing...' : 'Deposit On-Chain'}
                  <span className="block text-[10px] opacity-75">Base Sepolia</span>
                </button>
              ) : (
                <button disabled className="py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-400 cursor-not-allowed">
                  Connect Wallet
                  <span className="block text-[10px]">Use sidebar</span>
                </button>
              )}
              <button disabled className="py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-400 cursor-not-allowed">
                Pay with Card
                <span className="block text-[10px]">Coming Soon</span>
              </button>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Listing</label>
              <select value={simListing} onChange={e => setSimListing(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm">
                {listings.map(l => (
                  <option key={l.id} value={l.id}>{l.headline || CATEGORY_DISPLAY_NAMES[l.category]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Amount (USDC)</label>
              <input type="number" value={simAmount} onChange={e => setSimAmount(e.target.value)} min="1"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            {txStep === 'approving' && (
              <p className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">Submitting approval... Please confirm in your wallet.</p>
            )}
            {txStep === 'depositing' && (
              <p className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">Confirming deposit on Base Sepolia...</p>
            )}
            {txStep === 'confirmed' && depositHash && (
              <div className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                <p>Confirmed! {simResult}</p>
                <a href={basescanTx(depositHash)} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline text-xs">
                  View on Basescan
                </a>
              </div>
            )}
            {simResult && txStep === 'idle' && <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">{simResult}</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Per-Listing Balances</h2>
        <div className="space-y-3">
          {listings.map(l => {
            const pct = (l.escrowRemainingUsdc / l.escrowFundedUsdc) * 100;
            return (
              <Link key={l.id} href={`/listings/${l.id}`} className="block hover:bg-zinc-50 rounded-lg px-3 py-2 -mx-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{l.headline || CATEGORY_DISPLAY_NAMES[l.category]}</span>
                  <span className="text-sm text-zinc-600">${l.escrowRemainingUsdc.toLocaleString()} / ${l.escrowFundedUsdc.toLocaleString()}</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${pct > 30 ? 'bg-emerald-500' : pct > 10 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Transaction History ({transactions.length})</h2>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-xs text-zinc-500 border-b border-zinc-200">
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium text-right">Amount</th>
                <th className="pb-2 font-medium">Tx Hash</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 50).map(tx => (
                <tr key={tx.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="py-2 text-zinc-600 text-xs">{new Date(tx.timestamp).toLocaleString()}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${tx.type === 'deposit' ? 'bg-green-100 text-green-700' : tx.type === 'claim_deduction' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>
                      {tx.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2 text-right font-medium">{tx.type === 'claim_deduction' ? '-' : '+'}${tx.amountUsdc.toFixed(2)}</td>
                  <td className="py-2 font-mono text-xs text-zinc-400" title={tx.txHash}>{tx.txHash.slice(0, 10)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <p className="text-xs text-zinc-500 font-medium">{label}</p>
      <p className="text-xl font-semibold text-zinc-900 mt-1">{value}</p>
    </div>
  );
}

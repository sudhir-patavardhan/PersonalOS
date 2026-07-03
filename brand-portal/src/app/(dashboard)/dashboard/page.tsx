'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { BrandKPI, Listing, Alert } from '@/lib/types';

interface DashboardData {
  profile: { name: string; vertical: string };
  kpis: BrandKPI[];
  topListings: (Listing & { claims7d: number })[];
  dailyClaims: { date: string; claims: number; spend: number }[];
  alerts: Alert[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading campaign data...</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Campaign Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">{data.profile.name} &middot; {data.profile.vertical}</p>
      </div>

      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map(alert => (
            <Link key={alert.id} href={`/listings/${alert.listingId}`}
              className={`block rounded-lg px-4 py-3 text-sm ${alert.severity === 'critical' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
              <span className="font-medium">{alert.severity === 'critical' ? 'Critical' : 'Warning'}:</span> {alert.message}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {data.kpis.map(kpi => (
          <Link key={kpi.label} href={kpi.href}
            className="bg-white rounded-xl border border-zinc-200 p-4 hover:shadow-md transition-shadow">
            <p className="text-xs text-zinc-500 font-medium">{kpi.label}</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-2xl font-semibold text-zinc-900">{kpi.value}</p>
              {kpi.trend !== 0 && (
                <span className={`text-xs font-medium ${kpi.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Claims (7d)</h2>
          {data.dailyClaims.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.dailyClaims}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => `${Number(v)}`} />
                <Bar dataKey="claims" fill="#10b981" radius={[4, 4, 0, 0]} name="Claims" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-zinc-400 text-sm">No claims data yet</p>}
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Top Listings by Claims</h2>
          <div className="space-y-3">
            {data.topListings.map(listing => (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="flex items-center justify-between hover:bg-zinc-50 rounded-lg px-2 py-1.5 -mx-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{listing.headline || listing.category}</p>
                  <p className="text-xs text-zinc-500">{listing.category} &middot; ${listing.bidPerClaimUsdc.toFixed(2)}/claim</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold text-zinc-900">{listing.claims7d}</p>
                  <p className="text-xs text-zinc-500">claims</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

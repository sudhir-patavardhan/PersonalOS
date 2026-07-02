'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Brand, Settlement } from '@/lib/types';
import { CATEGORY_DISPLAY_NAMES } from '@/lib/types';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setBrands(d.brands);
      setSettlements(d.settlements);
    });
  }, []);

  if (brands.length === 0) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading...</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Brand Management</h1>
        <p className="text-sm text-zinc-500 mt-1">{brands.length} verified brands with {brands.reduce((s, b) => s + b.listings.length, 0)} listings</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {brands.map(brand => {
          const brandSettlements = settlements.filter(s => s.brandName === brand.name);
          const totalSpent = brandSettlements.reduce((s, t) => s + t.bidUsdc, 0);
          const totalEscrow = brand.listings.reduce((s, l) => s + l.escrowFundedUsdc, 0);
          const remaining = brand.listings.reduce((s, l) => s + l.escrowRemainingUsdc, 0);
          const utilization = totalEscrow > 0 ? ((totalEscrow - remaining) / totalEscrow * 100) : 0;
          return (
            <Link key={brand.id} href={`/brands/${brand.id}`}
              className="bg-white rounded-xl border border-zinc-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-zinc-900">{brand.name}</h3>
                  <p className="text-xs text-zinc-500">{brand.vertical}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${brand.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-600'}`}>
                  {brand.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Listings</span>
                  <span className="text-zinc-900 font-medium">{brand.listings.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Categories</span>
                  <span className="text-zinc-900">{brand.listings.map(l => CATEGORY_DISPLAY_NAMES[l.category] || l.category).join(', ')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Claims</span>
                  <span className="text-zinc-900 font-medium">{brandSettlements.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Spent / Funded</span>
                  <span className="text-zinc-900">${totalSpent.toFixed(2)} / ${totalEscrow.toLocaleString()}</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(utilization, 100)}%` }} />
                </div>
                <p className="text-[10px] text-zinc-400 text-right">{utilization.toFixed(1)}% utilized</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

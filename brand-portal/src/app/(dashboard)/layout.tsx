'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/listings', label: 'Listings', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { href: '/escrow', label: 'Escrow', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/performance', label: 'Performance', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/optimize', label: 'Optimize', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
  { href: '/marketplace', label: 'Marketplace', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '---', label: '', icon: '' },
  { href: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [brandName, setBrandName] = useState('Brand Portal');

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      if (d.profile?.name) setBrandName(d.profile.name);
    }).catch(() => {});
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const { address, isConnected } = useAccount();

  return (
    <div className="flex h-full">
      <aside className="w-56 bg-zinc-900 text-zinc-300 flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-zinc-800">
          <h1 className="text-sm font-semibold text-white truncate">{brandName}</h1>
          <p className="text-xs text-zinc-500">Brand Portal</p>
        </div>
        <div className="px-3 py-3 border-b border-zinc-800">
          {isConnected ? (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-900/30 border border-emerald-800/50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-300 truncate font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </div>
          ) : (
            <Wallet>
              <ConnectWallet className="!w-full !rounded-lg !text-xs !py-2 !bg-blue-600 !text-white hover:!bg-blue-700" text="Connect Wallet" />
              <WalletDropdown>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          )}
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map((item, i) => {
            if (item.href === '---') return <div key={i} className="my-3 border-t border-zinc-800" />;
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800/50 hover:text-white'}`}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-2 py-3 border-t border-zinc-800">
          <button onClick={handleLogout} disabled={loggingOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
          <p className="text-[10px] text-zinc-600 px-3 mt-2">Synthetic data mode</p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

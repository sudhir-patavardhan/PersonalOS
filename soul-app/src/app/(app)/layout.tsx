'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const TABS = [
  { href: '/home', label: 'Home', icon: (active: boolean) => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={active ? 'url(#grad)' : 'currentColor'} strokeWidth={1.8}><defs><linearGradient id="grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="#22d3ee"/></linearGradient></defs><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { href: '/consents', label: 'Consents', icon: (active: boolean) => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={active ? 'url(#grad)' : 'currentColor'} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
  { href: '/offers', label: 'Offers', icon: (active: boolean) => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={active ? 'url(#grad)' : 'currentColor'} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg> },
  { href: '/wallet', label: 'Wallet', icon: (active: boolean) => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={active ? 'url(#grad)' : 'currentColor'} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
  { href: '/profile', label: 'Profile', icon: (active: boolean) => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={active ? 'url(#grad)' : 'currentColor'} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [offerCount, setOfferCount] = useState(0);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      if (d.pendingOfferCount) setOfferCount(d.pendingOfferCount);
    }).catch(() => {});
  }, []);

  return (
    <div className="h-full flex flex-col">
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-none border-t border-white/10 border-x-0 border-b-0"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(10, 10, 15, 0.85)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-around py-2 px-4">
          {TABS.map(tab => {
            const isActive = pathname === tab.href || (tab.href !== '/home' && pathname.startsWith(tab.href));
            return (
              <Link key={tab.href} href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all relative ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {tab.icon(isActive)}
                <span className={`text-[10px] font-medium ${isActive ? 'gradient-text' : ''}`}>{tab.label}</span>
                {tab.href === '/offers' && offerCount > 0 && (
                  <span className="absolute -top-1 right-0 w-4 h-4 bg-violet-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">{offerCount}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

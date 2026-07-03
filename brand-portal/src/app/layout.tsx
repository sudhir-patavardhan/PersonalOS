import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import '@coinbase/onchainkit/styles.css';
import { Providers } from './providers';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PersonalOS Brand Portal',
  description: 'Privacy-preserving marketplace dashboard for brand advertisers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full bg-zinc-50 text-zinc-900 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

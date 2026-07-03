export interface SurfaceConfig {
  id: string;
  name: string;
  description: string;
  port: number;
  accentClass: string;
  accentColor: string;
  icon: string;
  persona: string;
  loginHint: string;
  demoPersona: string;
  metricsLabels: string[];
}

export const SURFACES: SurfaceConfig[] = [
  {
    id: 'operator-console',
    name: 'Operator Console',
    description: 'Platform admin dashboard — Exchange health, Soul metrics, revenue analytics, compliance tools',
    port: 3000,
    accentClass: 'accent-operator',
    accentColor: '#f59e0b',
    icon: '⚙️',
    persona: 'Platform Admin',
    loginHint: 'admin@personalos.demo / demo1234',
    demoPersona: 'admin',
    metricsLabels: ['Souls', 'Listings', 'Claims today'],
  },
  {
    id: 'brand-portal',
    name: 'Brand Portal',
    description: 'Brand marketplace interface — campaign creation, escrow funding, performance analytics, optimization',
    port: 3001,
    accentClass: 'accent-brand',
    accentColor: '#3b82f6',
    icon: '📊',
    persona: 'Whole Foods Market',
    loginHint: 'admin@wholefoods.demo / demo1234',
    demoPersona: 'wholefoods',
    metricsLabels: ['Listings', 'Total escrowed', 'Claim rate'],
  },
  {
    id: 'soul-app',
    name: 'Soul App',
    description: 'Soul-facing app — data insights, consent management, offers, wallet, privacy controls',
    port: 3002,
    accentClass: 'accent-soul',
    accentColor: '#8b5cf6',
    icon: '👤',
    persona: 'Priya Sharma',
    loginHint: 'priya@personalos.demo / demo1234 + TOTP',
    demoPersona: 'priya',
    metricsLabels: ['Depth Score', 'Consents', 'Balance'],
  },
];

export const NARRATIVE_STEPS = [
  {
    step: 1,
    surface: 'Brand Portal',
    accentColor: '#3b82f6',
    title: 'Brand Funds a Campaign',
    description: 'Whole Foods Market creates a Listing targeting the "Grocery Patterns" category. They deposit $5,000 USDC into an on-chain escrow smart contract on Base. The budget is locked — only Claims can draw from it.',
    keyNumber: '$5,000',
    keyLabel: 'Budget escrowed',
    screenshot: 'step1-escrow.png',
  },
  {
    step: 2,
    surface: 'Operator Console',
    accentColor: '#f59e0b',
    title: 'Exchange Matches Souls',
    description: 'The Exchange runs continuous matching — it finds 847 Souls who have granted "Grocery Patterns" consent and whose Depth Score meets the 40% threshold. No personal data leaves the device; the Exchange only sees noisy Insight scores.',
    keyNumber: '847',
    keyLabel: 'Souls eligible',
    screenshot: 'step2-exchange.png',
  },
  {
    step: 3,
    surface: 'Soul App',
    accentColor: '#8b5cf6',
    title: 'Soul Receives an Offer',
    description: 'Alex Rivera sees a new Offer in their feed: "Fresh organic groceries delivered — 20% off your first Whole Foods delivery." The Offer shows $1.28 potential earnings. Alex\'s actual data never left their device.',
    keyNumber: '$1.28',
    keyLabel: 'Yield for Alex',
    screenshot: 'step3-offer.png',
  },
  {
    step: 4,
    surface: 'Soul App',
    accentColor: '#8b5cf6',
    title: 'Soul Claims the Offer',
    description: 'Alex taps "Claim" and authenticates with a passkey signature. The Claim triggers an atomic on-chain settlement: $1.50 from escrow splits into $0.22 platform fee (15%) and $1.28 Yield deposited directly into Alex\'s wallet.',
    keyNumber: 'Claimed',
    keyLabel: 'Passkey signed',
    screenshot: 'step4-claim.png',
  },
  {
    step: 5,
    surface: 'Operator Console',
    accentColor: '#f59e0b',
    title: 'Platform Earns a Fee',
    description: 'The Operator Console logs the Claim event in real-time. The 15% take rate ($0.22) is PersonalOS revenue. The platform only earns when Souls earn — incentives are perfectly aligned.',
    keyNumber: '15%',
    keyLabel: 'Take rate',
    screenshot: 'step5-fee.png',
  },
  {
    step: 6,
    surface: 'Brand Portal',
    accentColor: '#3b82f6',
    title: 'Brand Sees Results',
    description: 'Whole Foods\' campaign dashboard updates: one new Claim, Budget drawn down to $4,998.50. The Brand sees aggregate performance (claim rate, spend) but never learns which Soul claimed — just that someone with matching grocery patterns engaged.',
    keyNumber: '$4,998.50',
    keyLabel: 'Budget remaining',
    screenshot: 'step6-dashboard.png',
  },
  {
    step: 7,
    surface: 'Soul App',
    accentColor: '#8b5cf6',
    title: 'Soul\'s Wallet Grows',
    description: 'Alex\'s Wallet shows the +$1.28 deposit with a blockchain transaction hash. Total balance increases. The wallet is non-custodial — Alex can export it anytime. PersonalOS cannot access these funds.',
    keyNumber: '$48.81',
    keyLabel: 'Total balance',
    screenshot: 'step7-wallet.png',
  },
];

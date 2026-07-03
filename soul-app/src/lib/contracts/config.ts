import { baseSepolia } from "viem/chains";

export const CHAIN = baseSepolia;

export const USDC_ADDRESS = "0xe32a5079e1c2f0fe33f317391726b95737404537" as const;
export const ESCROW_ADDRESS = "0x459182834256ea94fca3676e3fb9162c5441bd80" as const;

export const OPERATOR_ADDRESS = "0xac05f498Ff6A85995717e77bF52CB5eF8394A095" as const;
export const BRAND_ADDRESS = "0xe172BFDB482a8B4E6c6c386415b4Fc040526BDA7" as const;
export const SOUL_ADDRESS = "0x8a3C6955ebE70a527Bb452bc89466d43429B4154" as const;

export const USDC_DECIMALS = 6;
export const FEE_BPS = 1000;

export const BASESCAN_URL = "https://sepolia.basescan.org";

export function basescanTx(hash: string) {
  return `${BASESCAN_URL}/tx/${hash}`;
}

export function basescanAddress(address: string) {
  return `${BASESCAN_URL}/address/${address}`;
}

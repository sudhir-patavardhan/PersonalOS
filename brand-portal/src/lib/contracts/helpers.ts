import { createPublicClient, http, formatUnits, parseUnits, keccak256, toHex } from "viem";
import { CHAIN, USDC_ADDRESS, ESCROW_ADDRESS, USDC_DECIMALS } from "./config";
import { BUDGET_ESCROW_ABI, ERC20_ABI } from "./abis";

export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(),
});

export function listingIdFromString(id: string): `0x${string}` {
  return keccak256(toHex(id));
}

export function formatUSDC(amount: bigint): string {
  return formatUnits(amount, USDC_DECIMALS);
}

export function parseUSDC(amount: string): bigint {
  return parseUnits(amount, USDC_DECIMALS);
}

export async function getEscrowBalance(listingId: `0x${string}`): Promise<bigint> {
  return publicClient.readContract({
    address: ESCROW_ADDRESS,
    abi: BUDGET_ESCROW_ABI,
    functionName: "getBalance",
    args: [listingId],
  });
}

export async function getUSDCBalance(address: `0x${string}`): Promise<bigint> {
  return publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address],
  });
}

export async function getUSDCAllowance(owner: `0x${string}`, spender: `0x${string}`): Promise<bigint> {
  return publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [owner, spender],
  });
}

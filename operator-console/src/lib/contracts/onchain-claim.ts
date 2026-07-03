import { createWalletClient, createPublicClient, http, parseUnits, keccak256, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { ESCROW_ADDRESS, USDC_DECIMALS, SOUL_ADDRESS } from "./config";
import { BUDGET_ESCROW_ABI } from "./abis";

const OPERATOR_KEY = process.env.OPERATOR_PRIVATE_KEY;

function getClients() {
  if (!OPERATOR_KEY) return null;
  const account = privateKeyToAccount(OPERATOR_KEY as `0x${string}`);
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http() });
  return { account, publicClient, walletClient };
}

export interface OnChainClaimResult {
  txHash: string;
  yieldUsdc: number;
  feeUsdc: number;
  soulAddress: string;
}

export async function claimOnChain(
  listingId: string,
  bidUsdc: number,
): Promise<OnChainClaimResult | null> {
  const clients = getClients();
  if (!clients) {
    console.warn("[onchain-claim] OPERATOR_PRIVATE_KEY not set, skipping on-chain claim");
    return null;
  }

  const { publicClient, walletClient } = clients;
  const listingHash = keccak256(toHex(listingId));
  const amount = parseUnits(bidUsdc.toString(), USDC_DECIMALS);

  const hash = await walletClient.writeContract({
    address: ESCROW_ADDRESS,
    abi: BUDGET_ESCROW_ABI,
    functionName: "claim",
    args: [listingHash, SOUL_ADDRESS, amount],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status !== "success") {
    throw new Error(`On-chain claim reverted: ${hash}`);
  }

  const feeUsdc = Math.round(bidUsdc * 0.10 * 100) / 100;
  const yieldUsdc = Math.round(bidUsdc * 0.90 * 100) / 100;

  return {
    txHash: hash,
    yieldUsdc,
    feeUsdc,
    soulAddress: SOUL_ADDRESS,
  };
}

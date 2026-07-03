import { createWalletClient, createPublicClient, http, formatEther, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadArtifact(name: string) {
  const path = join(__dirname, "..", "artifacts", "src", `${name}.sol`, `${name}.json`);
  return JSON.parse(readFileSync(path, "utf-8"));
}

async function main() {
  const operatorKey = process.env.OPERATOR_PRIVATE_KEY;
  if (!operatorKey) {
    console.error("OPERATOR_PRIVATE_KEY not set");
    process.exit(1);
  }

  const rpcUrl = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
  const account = privateKeyToAccount(operatorKey as `0x${string}`);

  const publicClient = createPublicClient({ chain: baseSepolia, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http(rpcUrl) });

  console.log("Deploying with:", account.address);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Balance:", formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("No ETH balance. Get testnet ETH from https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
    process.exit(1);
  }

  // Deploy MockUSDC
  const mockUsdc = loadArtifact("MockUSDC");
  const usdcHash = await walletClient.deployContract({
    abi: mockUsdc.abi,
    bytecode: mockUsdc.bytecode as `0x${string}`,
  });
  console.log("MockUSDC deploy tx:", usdcHash);
  const usdcReceipt = await publicClient.waitForTransactionReceipt({ hash: usdcHash });
  const usdcAddress = usdcReceipt.contractAddress!;
  console.log("MockUSDC deployed to:", usdcAddress);

  // Deploy BudgetEscrow
  const budgetEscrow = loadArtifact("BudgetEscrow");
  const escrowHash = await walletClient.deployContract({
    abi: budgetEscrow.abi,
    bytecode: budgetEscrow.bytecode as `0x${string}`,
    args: [usdcAddress, account.address],
  });
  console.log("BudgetEscrow deploy tx:", escrowHash);
  const escrowReceipt = await publicClient.waitForTransactionReceipt({ hash: escrowHash });
  const escrowAddress = escrowReceipt.contractAddress!;
  console.log("BudgetEscrow deployed to:", escrowAddress);

  // Pre-mint to Brand wallet
  const brandAddress = process.env.BRAND_WALLET_ADDRESS;
  if (brandAddress) {
    const mintHash = await walletClient.writeContract({
      address: usdcAddress,
      abi: mockUsdc.abi,
      functionName: "mint",
      args: [brandAddress as `0x${string}`, parseUnits("100000", 6)],
    });
    await publicClient.waitForTransactionReceipt({ hash: mintHash });
    console.log("Minted 100,000 USDC to Brand:", brandAddress);
  }

  console.log("\n=== Deployment Summary ===");
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}`);
  console.log(`NEXT_PUBLIC_ESCROW_ADDRESS=${escrowAddress}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=84532`);
  console.log(`Operator: ${account.address}`);
  if (brandAddress) console.log(`Brand: ${brandAddress}`);
  console.log(`\nBasescan: https://sepolia.basescan.org/address/${escrowAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

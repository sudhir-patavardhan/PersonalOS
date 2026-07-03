import { HardhatUserConfig } from "hardhat/config";
import HardhatFoundry from "@nomicfoundation/hardhat-foundry";

const DEPLOYER_KEY = process.env.OPERATOR_PRIVATE_KEY || "0x" + "00".repeat(32);

const config: HardhatUserConfig = {
  plugins: [HardhatFoundry],
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
  paths: {
    sources: "./src",
    cache: "./cache_hardhat",
    artifacts: "./artifacts",
  },
  networks: {
    baseSepolia: {
      type: "http",
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      accounts: [DEPLOYER_KEY],
      chainId: 84532,
    },
  },
};

export default config;

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    zenchain: {
      url: process.env.ZENCHAIN_RPC_URL || "https://zenchain-testnet.api.onfinality.io/public",
      chainId: parseInt(process.env.ZENCHAIN_CHAIN_ID || "8408"),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    zenchainTestnet: {
      url: process.env.ZENCHAIN_RPC_URL || "https://zenchain-testnet.api.onfinality.io/public",
      chainId: 8408,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei (fixed gas price)
      gas: 8000000, // Gas limit
      timeout: 60000, // 60 seconds timeout
      httpHeaders: {},
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "./typechain-types",
    target: "ethers-v6",
  },
};

export default config;

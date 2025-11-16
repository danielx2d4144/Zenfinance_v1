/**
 * Contract Addresses Configuration
 * Update these addresses after deploying to testnet/mainnet
 */

// Localhost deployment addresses (for development)
export const LOCALHOST_CONTRACTS = {
  pool: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
  oracle: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  assetRegistry: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  interestRateModel: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  aTokens: {
    WBTC: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    USDC: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    USDT: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    ZTC: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    ZFI: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    ZY: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
    DUM1: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    DUM2: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
  },
};

// Testnet deployment addresses (will be updated after deployment)
export const TESTNET_CONTRACTS = {
  pool: process.env.NEXT_PUBLIC_POOL_ADDRESS || "",
  oracle: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || "",
  assetRegistry: process.env.NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS || "",
  interestRateModel: process.env.NEXT_PUBLIC_INTEREST_RATE_MODEL_ADDRESS || "",
  aTokens: {
    WBTC: process.env.NEXT_PUBLIC_ATOKEN_WBTC_ADDRESS || "",
    USDC: process.env.NEXT_PUBLIC_ATOKEN_USDC_ADDRESS || "",
    USDT: process.env.NEXT_PUBLIC_ATOKEN_USDT_ADDRESS || "",
    ZTC: process.env.NEXT_PUBLIC_ATOKEN_ZTC_ADDRESS || "",
    ZFI: process.env.NEXT_PUBLIC_ATOKEN_ZFI_ADDRESS || "",
    ZY: process.env.NEXT_PUBLIC_ATOKEN_ZY_ADDRESS || "",
    DUM1: process.env.NEXT_PUBLIC_ATOKEN_DUM1_ADDRESS || "",
    DUM2: process.env.NEXT_PUBLIC_ATOKEN_DUM2_ADDRESS || "",
  },
};

/**
 * Get contract addresses based on environment
 * Priority: Environment variables > Testnet config > Localhost config
 */
export function getContractAddresses() {
  // Always prefer environment variables (testnet/mainnet deployment)
  // If environment variables are set, use testnet contracts
  if (process.env.NEXT_PUBLIC_POOL_ADDRESS) {
    return TESTNET_CONTRACTS;
  }
  
  // Check if we're in development (localhost)
  if (typeof window !== "undefined") {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocalhost) {
      return LOCALHOST_CONTRACTS;
    }
  }
  
  // Default to testnet contracts (will use env vars if set)
  return TESTNET_CONTRACTS;
}

/**
 * Get contract address for a specific contract
 */
export function getContractAddress(contractName: keyof typeof LOCALHOST_CONTRACTS): string {
  const addresses = getContractAddresses();
  return addresses[contractName] as string;
}

/**
 * Get aToken address for an asset
 */
export function getATokenAddress(symbol: string): string {
  const addresses = getContractAddresses();
  return addresses.aTokens[symbol as keyof typeof addresses.aTokens] || "";
}


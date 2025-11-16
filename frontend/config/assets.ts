/**
 * Asset Configuration for ZenFinance
 * Includes APY values, LTV, liquidation thresholds, and reserve factors
 */

export interface AssetConfig {
  name: string;
  symbol: string;
  address: string; // Token contract address
  decimals: number;
  supplyAPY: number; // As decimal (0.085 = 8.5%)
  borrowAPY: number; // As decimal (0.12 = 12%)
  ltv: number; // Loan-to-Value ratio (0.75 = 75%)
  liquidationThreshold: number; // (0.80 = 80%)
  reserveFactor: number; // (0.10 = 10%)
  icon?: string; // Emoji or image path
  canBeCollateral: boolean;
}

/**
 * Asset configurations with updated APY values (5-20% range)
 * WBTC increased, ZTC reduced
 */
export const ASSET_CONFIG: Record<string, AssetConfig> = {
  WBTC: {
    name: "Zipped BTC",
    symbol: "WBTC",
    address: "0xE267b9cC76a614b8E178b4552e9983d1F19CEB05",
    decimals: 8,
    supplyAPY: 0.085, // 8.50%
    borrowAPY: 0.12, // 12.00%
    ltv: 0.75, // 75%
    liquidationThreshold: 0.80, // 80%
    reserveFactor: 0.10, // 10%
    icon: "",
    canBeCollateral: true,
  },
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    address: "0x44D25859F79787fF937ec1305Dbf0866d6064E21",
    decimals: 6,
    supplyAPY: 0.055, // 5.50%
    borrowAPY: 0.08, // 8.00%
    ltv: 0.75,
    liquidationThreshold: 0.80,
    reserveFactor: 0.10,
    icon: "",
    canBeCollateral: true,
  },
  USDT: {
    name: "Tether",
    symbol: "USDT",
    address: "0x2A0B66dEb779EF7DF45b064eF5cee2B1bF6E5DD5",
    decimals: 6,
    supplyAPY: 0.05, // 5.00%
    borrowAPY: 0.075, // 7.50%
    ltv: 0.75,
    liquidationThreshold: 0.80,
    reserveFactor: 0.10,
    icon: "",
    canBeCollateral: true,
  },
  ZTC: {
    name: "ZenChain Token",
    symbol: "ZTC",
    address: "0x0000000000000000000000000000000000000804",
    decimals: 18,
    supplyAPY: 0.1875, // 18.75%
    borrowAPY: 0.25, // 25.00%
    ltv: 0.75,
    liquidationThreshold: 0.80,
    reserveFactor: 0.10,
    icon: "",
    canBeCollateral: true,
  },
  ZFI: {
    name: "ZenFinance Token",
    symbol: "ZFI",
    address: "0x867bb07d47A3BF3d1f6835a71A2Ba639bf445DA9",
    decimals: 18,
    supplyAPY: 0.155, // 15.50%
    borrowAPY: 0.22, // 22.00%
    ltv: 0.75,
    liquidationThreshold: 0.80,
    reserveFactor: 0.10,
    icon: "",
    canBeCollateral: true,
  },
  ZY: {
    name: "Zynft Token",
    symbol: "ZY",
    address: "0x7f7752745A56e5B09Bd8d9fE6d6C3b3477E441FF",
    decimals: 18,
    supplyAPY: 0.125, // 12.50%
    borrowAPY: 0.1875, // 18.75%
    ltv: 0.75,
    liquidationThreshold: 0.80,
    reserveFactor: 0.10,
    icon: "",
    canBeCollateral: true,
  },
  DUM1: {
    name: "DUMMY1 Token",
    symbol: "DUM1",
    address: "0xfEf87C98507A92ee3968c40D2ebEbBE3638D7D29",
    decimals: 18,
    supplyAPY: 0.0725, // 7.25%
    borrowAPY: 0.105, // 10.50%
    ltv: 0.75,
    liquidationThreshold: 0.80,
    reserveFactor: 0.10,
    icon: "",
    canBeCollateral: true,
  },
  DUM2: {
    name: "DUMMY2 Token",
    symbol: "DUM2",
    address: "0xFd029224030f6227B0Eee44003B464063707b1e9",
    decimals: 18,
    supplyAPY: 0.10, // 10.00%
    borrowAPY: 0.15, // 15.00%
    ltv: 0.75,
    liquidationThreshold: 0.80,
    reserveFactor: 0.10,
    icon: "",
    canBeCollateral: true,
  },
};

/**
 * Interest Rate Model Configuration
 * Optimized for project sustainability
 */
export const INTEREST_RATE_MODEL = {
  baseRate: 0.02, // 2% - ensures minimum returns
  slope1: 0.08, // 8% - moderate growth
  slope2: 0.50, // 50% - sharp increase to prevent over-utilization
  optimalUtilization: 0.75, // 75% - matches LTV for safety
} as const;

/**
 * APY Calculation Configuration
 */
export const APY_CONFIG = {
  compoundingFrequency: 365, // Daily compounding (n = 365)
} as const;

/**
 * Get asset configuration by symbol
 */
export function getAssetConfig(symbol: string): AssetConfig | undefined {
  return ASSET_CONFIG[symbol.toUpperCase()];
}

/**
 * Format APY as percentage string
 */
export function formatAPY(apy: number, decimals: number = 2): string {
  if (apy < 0.0001) {
    return "< 0.01%";
  }
  return `${(apy * 100).toFixed(decimals)}%`;
}

/**
 * Get all asset symbols
 */
export function getAllAssetSymbols(): string[] {
  return Object.keys(ASSET_CONFIG);
}

/**
 * Get all assets as array
 */
export function getAllAssets(): AssetConfig[] {
  return Object.values(ASSET_CONFIG);
}


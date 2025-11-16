/**
 * DEX Pair Configuration for ZenSwap
 * Pair addresses for price fetching
 */

export interface PairConfig {
  tokenA: string; // Token A symbol
  tokenB: string; // Token B symbol
  address: string; // Pair contract address
  tokenAAddress: string; // Token A contract address
  tokenBAddress: string; // Token B contract address
  isDirectUSDC: boolean; // Whether this is a direct USDC pair
  routingPath?: string[]; // Intermediate routing path if not direct
}

/**
 * DEX Pair configurations
 * All pairs use USDC as base for USD price calculations
 */
export const PAIR_CONFIG: Record<string, PairConfig> = {
  "ZTC/USDC": {
    tokenA: "ZTC",
    tokenB: "USDC",
    address: "0x016a0f043d85b254203062169d6b333011261cbd",
    tokenAAddress: "0x0000000000000000000000000000000000000804", // ZTC
    tokenBAddress: "0x44D25859F79787fF937ec1305Dbf0866d6064E21", // USDC
    isDirectUSDC: true,
  },
  "USDC/zBTC": {
    tokenA: "USDC",
    tokenB: "WBTC",
    address: "0xece73c04e2b5abfdb08636c1ab89c8e70ba649ac",
    tokenAAddress: "0x44D25859F79787fF937ec1305Dbf0866d6064E21", // USDC
    tokenBAddress: "0xE267b9cC76a614b8E178b4552e9983d1F19CEB05", // WBTC
    isDirectUSDC: true,
  },
  "USDC/DUM1": {
    tokenA: "USDC",
    tokenB: "DUM1",
    address: "0x0493ffe12b20d0ce865e9af9af8c113b566b8469",
    tokenAAddress: "0x44D25859F79787fF937ec1305Dbf0866d6064E21", // USDC
    tokenBAddress: "0xfEf87C98507A92ee3968c40D2ebEbBE3638D7D29", // DUM1
    isDirectUSDC: true,
  },
  "USDC/DUM2": {
    tokenA: "USDC",
    tokenB: "DUM2",
    address: "0x793442461977dc1ed5a3cfcbcfcb6d911e223fec",
    tokenAAddress: "0x44D25859F79787fF937ec1305Dbf0866d6064E21", // USDC
    tokenBAddress: "0xFd029224030f6227B0Eee44003B464063707b1e9", // DUM2
    isDirectUSDC: true,
  },
  "USDC/ZY": {
    tokenA: "USDC",
    tokenB: "ZY",
    address: "0x47140980edad6ffd0aca7ac45220f555575573f1",
    tokenAAddress: "0x44D25859F79787fF937ec1305Dbf0866d6064E21", // USDC
    tokenBAddress: "0x7f7752745A56e5B09Bd8d9fE6d6C3b3477E441FF", // ZY
    isDirectUSDC: true,
  },
  "USDT/USDC": {
    tokenA: "USDT",
    tokenB: "USDC",
    address: "0xfdef2d91356ba19a526484eb904f672d59608870",
    tokenAAddress: "0x2A0B66dEb779EF7DF45b064eF5cee2B1bF6E5DD5", // USDT
    tokenBAddress: "0x44D25859F79787fF937ec1305Dbf0866d6064E21", // USDC
    isDirectUSDC: true,
  },
  "ZTC/ZFI": {
    tokenA: "ZTC",
    tokenB: "ZFI",
    address: "0x48f0f1a8189d9273c231ea872d2be28795f6e5de",
    tokenAAddress: "0x0000000000000000000000000000000000000804", // ZTC
    tokenBAddress: "0x867bb07d47A3BF3d1f6835a71A2Ba639bf445DA9", // ZFI
    isDirectUSDC: false,
    routingPath: ["ZTC", "USDC"], // ZFI → ZTC → USDC
  },
};

/**
 * USDC token address (base for USD prices)
 */
export const USDC_ADDRESS = "0x44D25859F79787fF937ec1305Dbf0866d6064E21";

/**
 * Get pair configuration for a token pair
 */
export function getPairConfig(tokenA: string, tokenB: string): PairConfig | undefined {
  const key1 = `${tokenA}/${tokenB}`;
  const key2 = `${tokenB}/${tokenA}`;
  return PAIR_CONFIG[key1] || PAIR_CONFIG[key2];
}

/**
 * Get direct USDC pair for a token
 */
export function getUSDCPair(tokenSymbol: string): PairConfig | undefined {
  if (tokenSymbol.toUpperCase() === "USDC") {
    // USDC/USDC is 1:1, no pair needed
    return undefined;
  }
  
  const usdcPair = getPairConfig(tokenSymbol, "USDC");
  if (usdcPair?.isDirectUSDC) {
    return usdcPair;
  }
  
  return undefined;
}

/**
 * Get routing path for a token to USDC
 * Returns array of intermediate tokens if direct pair doesn't exist
 */
export function getRoutingPathToUSDC(tokenSymbol: string): string[] {
  const upperToken = tokenSymbol.toUpperCase();
  
  // USDC is base, no routing needed
  if (upperToken === "USDC") {
    return [];
  }
  
  // Check for direct USDC pair
  const directPair = getUSDCPair(upperToken);
  if (directPair) {
    return [upperToken, "USDC"];
  }
  
  // Check for intermediate routing (e.g., ZFI → ZTC → USDC)
  const ztcPair = getPairConfig(upperToken, "ZTC");
  if (ztcPair) {
    return [upperToken, "ZTC", "USDC"];
  }
  
  // No route found
  return [];
}

/**
 * Get all direct USDC pairs
 */
export function getDirectUSDCPairs(): PairConfig[] {
  return Object.values(PAIR_CONFIG).filter((pair) => pair.isDirectUSDC);
}

/**
 * Check if token has direct USDC pair
 */
export function hasDirectUSDCPair(tokenSymbol: string): boolean {
  return getUSDCPair(tokenSymbol) !== undefined;
}


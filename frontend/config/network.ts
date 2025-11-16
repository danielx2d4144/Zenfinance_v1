/**
 * ZenChain Testnet Network Configuration
 */
export const ZENCHAIN_CONFIG = {
  name: "ZenChain Testnet",
  chainId: 8408,
  rpcUrl: "https://zenchain-testnet.api.onfinality.io/public",
  currencySymbol: "ZTC",
  blockExplorerUrl: "https://zentrace.io",
  nativeCurrency: {
    decimals: 18,
    name: "ZTC",
    symbol: "ZTC",
  },
} as const;

export type ZenChainConfig = typeof ZENCHAIN_CONFIG;


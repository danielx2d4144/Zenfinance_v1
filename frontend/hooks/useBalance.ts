/**
 * React hooks for fetching balances
 */

import { useReadContract, useBalance } from "wagmi";
import { useAccount } from "wagmi";
import { ConfigService } from "@/services/configService";
import { Address, formatUnits } from "viem";

const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Hook to get token decimals from contract
 */
export function useTokenDecimals(symbol: string, enabled: boolean = true) {
  const assetConfig = ConfigService.getAssetConfig(symbol);

  // For native token (ZTC), return 18
  if (symbol === "ZTC") {
    return { data: 18 };
  }

  // For ERC20 tokens, read from contract
  const { data: decimals, ...rest } = useReadContract({
    address: assetConfig?.address as Address | undefined,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: {
      enabled: enabled && !!assetConfig?.address,
    },
  });

  return {
    data: decimals !== undefined ? Number(decimals) : assetConfig?.decimals,
    ...rest,
  };
}

/**
 * Hook to get ERC20 token balance
 */
export function useTokenBalance(symbol: string, enabled: boolean = true) {
  const { address } = useAccount();
  const assetConfig = ConfigService.getAssetConfig(symbol);

  // For native token (ZTC), use wagmi's useBalance
  if (symbol === "ZTC") {
    const { data: balance, ...rest } = useBalance({
      address,
      query: {
        enabled: enabled && !!address,
      },
    });

    return {
      data: balance ? BigInt(balance.value.toString()) : undefined,
      formatted: balance?.formatted,
      ...rest,
    };
  }

  // For ERC20 tokens
  return useReadContract({
    address: assetConfig?.address as Address | undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: enabled && !!address && !!assetConfig?.address,
    },
  });
}

/**
 * Hook to format balance with decimals (uses contract decimals if available)
 */
export function useFormattedBalance(symbol: string, balance: bigint | undefined) {
  const assetConfig = ConfigService.getAssetConfig(symbol);
  const { data: contractDecimals } = useTokenDecimals(symbol, !!balance);
  
  if (!balance || !assetConfig) {
    return "0";
  }

  // Use contract decimals if available, otherwise fall back to config
  const decimals = contractDecimals !== undefined ? contractDecimals : assetConfig.decimals;
  return formatUnits(balance, decimals);
}

/**
 * Hook to get all wallet balances
 */
export function useAllWalletBalances(enabled: boolean = true) {
  const { address } = useAccount();
  const assets = ConfigService.getAllAssets();
  const balances: Record<string, bigint | undefined> = {};

  // This would need to be implemented with multiple useReadContract calls
  // For now, return empty object
  // In production, use multicall or batch calls
  return balances;
}


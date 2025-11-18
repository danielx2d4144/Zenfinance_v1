/**
 * React hook for fetching asset prices
 */

import { useReadContract } from "wagmi";
import { getContractAddress } from "@/config/contracts";
import { ConfigService } from "@/services/configService";
import { Address } from "viem";
import { useEffect, useState } from "react";

const ORACLE_ABI = [
  {
    inputs: [{ name: "token", type: "address" }],
    name: "getPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Hook to get price from Oracle
 */
export function usePriceFromOracle(symbol: string, enabled: boolean = true) {
  const assetConfig = ConfigService.getAssetConfig(symbol);
  const oracleAddress = getContractAddress("oracle");
  const isValidOracleAddress = Boolean(oracleAddress && oracleAddress !== "");

  const { data, isLoading, error, refetch } = useReadContract({
    address: isValidOracleAddress ? (oracleAddress as Address) : undefined,
    abi: ORACLE_ABI,
    functionName: "getPrice",
    args: assetConfig?.address ? [assetConfig.address as Address] : undefined,
    query: {
      enabled: Boolean(enabled && assetConfig?.address && isValidOracleAddress),
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Convert price from 1e18 scale to USD
  const price = data ? Number(data) / 1e18 : null;

  return {
    price,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get USD value of an amount
 */
export function useUSDValue(symbol: string, amount: string, enabled: boolean = true) {
  const { price } = usePriceFromOracle(symbol, enabled);
  const assetConfig = ConfigService.getAssetConfig(symbol);

  const [usdValue, setUsdValue] = useState<number>(0);

  useEffect(() => {
    if (price && amount && assetConfig) {
      const amountNumber = parseFloat(amount) || 0;
      setUsdValue(amountNumber * price);
    } else {
      setUsdValue(0);
    }
  }, [price, amount, assetConfig]);

  return usdValue;
}


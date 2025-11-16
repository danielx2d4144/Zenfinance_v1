/**
 * Hook to get detailed asset information for Asset Details page
 */

import { useMemo } from "react";
import { formatUnits } from "viem";
import { useTotalSupplied, useTotalBorrowed, usePriceFromOracle, useActiveSuppliers, useActiveBorrowers } from "./useContract";
import { useTokenDecimals } from "./useBalance";
import { ConfigService } from "@/services/configService";
import { formatBalance, formatUSD, formatAPY, formatPercentage } from "@/utils/format";
import { getContractAddress } from "@/config/contracts";

/**
 * Hook to get asset details data
 */
export function useAssetDetails(symbol: string) {
  const assetConfig = ConfigService.getAssetConfig(symbol);
  
  if (!assetConfig) {
    return null;
  }

  // Check if contract addresses are configured
  const poolAddress = getContractAddress("pool");
  const oracleAddress = getContractAddress("oracle");
  
  // If contract addresses are not configured, return null to show error message
  if (!poolAddress || poolAddress === "" || !oracleAddress || oracleAddress === "") {
    return null;
  }

  const { data: totalSuppliedRaw } = useTotalSupplied(symbol, true);
  const { data: totalBorrowedRaw } = useTotalBorrowed(symbol, true);
  const { price } = usePriceFromOracle(symbol, true);
  const { data: tokenDecimals } = useTokenDecimals(symbol, true);
  const { data: activeSuppliersRaw } = useActiveSuppliers(symbol, true);
  const { data: activeBorrowersRaw } = useActiveBorrowers(symbol, true);

  // Use contract decimals if available, otherwise fall back to config
  const decimals = tokenDecimals !== undefined ? tokenDecimals : assetConfig.decimals;

  // Calculate all asset details
  const details = useMemo(() => {
    if (!totalSuppliedRaw) {
      return {
        asset: assetConfig,
        supply: { amount: "0.00", usd: "$0.00" },
        liquidity: { amount: "0.00", usd: "$0.00" },
        utilizationRate: "0.00%",
        price: price ? formatUSD(price) : "$0.00",
        totalSupplied: { amount: "0.00", usd: "$0.00" },
        totalBorrowed: { amount: "-", usd: "-" },
        supplyAPY: formatAPY(assetConfig.supplyAPY || 0),
        borrowAPY: "-",
        maxLTV: formatPercentage(assetConfig.ltv),
        liquidationThreshold: formatPercentage(assetConfig.liquidationThreshold),
        reserveFactor: formatPercentage(assetConfig.reserveFactor),
        // Market info - placeholder values when data is not loaded
        marketInfo: {
          suppliers: activeSuppliersRaw ? Number(activeSuppliersRaw) : 0,
          borrowers: activeBorrowersRaw ? Number(activeBorrowersRaw) : 0,
          dailySupplyInterest: "$0.00",
          dailyBorrowInterest: "$0.00",
          exchangeRate: `1 ${symbol} = 1.0 a${symbol}`,
        },
      };
    }

    const totalSupplied = Number(formatUnits(totalSuppliedRaw, decimals));
    const totalBorrowed = totalBorrowedRaw && totalBorrowedRaw > 0n
      ? Number(formatUnits(totalBorrowedRaw, decimals))
      : 0;

    const suppliedUSD = price ? totalSupplied * price : 0;
    const borrowedUSD = price ? totalBorrowed * price : 0;
    const liquidityUSD = suppliedUSD - borrowedUSD;

    // Calculate utilization rate
    const utilization = ConfigService.calculateUtilizationRate(totalBorrowed, totalSupplied);
    
    // Calculate dynamic APY
    const borrowRate = ConfigService.calculateBorrowRate(utilization);
    const borrowAPYValue = ConfigService.calculateAPY(borrowRate);
    const supplyAPYValue = ConfigService.calculateSupplyAPY(
      borrowRate,
      utilization,
      assetConfig.reserveFactor
    );

    return {
      asset: assetConfig,
      supply: {
        amount: formatBalance(totalSupplied),
        usd: formatUSD(suppliedUSD),
      },
      liquidity: {
        amount: formatBalance(totalSupplied - totalBorrowed),
        usd: formatUSD(liquidityUSD),
      },
      utilizationRate: formatPercentage(utilization),
      price: price ? formatUSD(price) : "$0.00",
      totalSupplied: {
        amount: formatBalance(totalSupplied),
        usd: formatUSD(suppliedUSD),
      },
      totalBorrowed: totalBorrowed > 0
        ? {
            amount: formatBalance(totalBorrowed),
            usd: formatUSD(borrowedUSD),
          }
        : { amount: "-", usd: "-" },
      supplyAPY: formatAPY(supplyAPYValue),
      borrowAPY: totalBorrowed > 0 ? formatAPY(borrowAPYValue) : "-",
      maxLTV: formatPercentage(assetConfig.ltv),
      liquidationThreshold: formatPercentage(assetConfig.liquidationThreshold),
      reserveFactor: formatPercentage(assetConfig.reserveFactor),
      // Market info - now using real contract data for user counts
      marketInfo: {
        suppliers: activeSuppliersRaw ? Number(activeSuppliersRaw) : 0,
        borrowers: activeBorrowersRaw ? Number(activeBorrowersRaw) : 0,
        dailySupplyInterest: "$0.00", // TODO: Calculate from APY
        dailyBorrowInterest: "$0.00", // TODO: Calculate from APY
        exchangeRate: `1 ${symbol} = 1.0 a${symbol}`, // TODO: Get from aToken contract
      },
    };
  }, [totalSuppliedRaw, totalBorrowedRaw, price, assetConfig, decimals, activeSuppliersRaw, activeBorrowersRaw]);

  return details;
}


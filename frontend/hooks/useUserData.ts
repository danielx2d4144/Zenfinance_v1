/**
 * React hooks for fetching user data (supplies, borrows, balances)
 */

import { useAccount } from "wagmi";
import { useMemo } from "react";
import { useSupplyBalance, useBorrowBalance, usePriceFromOracle, useTokenBalance, useAvailableBorrow } from "./useContract";
import { useTokenDecimals } from "./useBalance";
import { ConfigService } from "@/services/configService";
import { formatBalance, formatUSD, formatAPY } from "@/utils/format";
import { formatUnits } from "viem";

/**
 * Hook to get all user supplies
 */
export function useUserSupplies() {
  const { isConnected } = useAccount();
  const allAssets = ConfigService.getAllAssets();

  // Get balances for all assets (this is simplified - in production, use multicall)
  const supplies = allAssets.map((asset) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: balance } = useSupplyBalance(asset.symbol, isConnected);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { price } = usePriceFromOracle(asset.symbol, isConnected);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: tokenDecimals } = useTokenDecimals(asset.symbol, isConnected);

    // Use contract decimals if available, otherwise fall back to config
    const decimals = tokenDecimals !== undefined ? tokenDecimals : asset.decimals;

    return {
      symbol: asset.symbol,
      asset: asset.symbol,
      assetName: asset.name,
      icon: asset.icon || "",
      balance: balance ? formatBalance(formatUnits(balance, decimals)) : "0.00",
      balanceRaw: balance || 0n,
      balanceUSD: price && balance 
        ? formatUSD(Number(formatUnits(balance, decimals)) * price) 
        : "$0.00",
      apy: formatAPY(asset.supplyAPY),
      collateral: asset.canBeCollateral,
      price: price || 0,
      decimals: decimals,
    };
  });

  // Filter to only show assets with balance > 0
  const activeSupplies = useMemo(() => {
    return supplies.filter((supply) => supply.balanceRaw > 0n);
  }, [supplies]);

  // Calculate totals
  const totalBalance = useMemo(() => {
    const total = activeSupplies.reduce((sum, supply) => {
      return sum + (Number(formatUnits(supply.balanceRaw, supply.decimals)) * supply.price);
    }, 0);
    return formatUSD(total);
  }, [activeSupplies]);

  const totalAPY = useMemo(() => {
    const totalValue = activeSupplies.reduce((sum, supply) => {
      return sum + (Number(formatUnits(supply.balanceRaw, supply.decimals)) * supply.price);
    }, 0);
    
    if (totalValue === 0) return "0.00%";
    
    const weightedAPY = activeSupplies.reduce((sum, supply) => {
      const assetConfig = ConfigService.getAssetConfig(supply.symbol);
      if (!assetConfig) return sum;
      const value = Number(formatUnits(supply.balanceRaw, supply.decimals)) * supply.price;
      return sum + (assetConfig.supplyAPY * value);
    }, 0);
    
    return formatAPY(weightedAPY / totalValue);
  }, [activeSupplies]);

  return {
    supplies: activeSupplies,
    allSupplies: supplies,
    totalBalance,
    totalAPY,
  };
}

/**
 * Hook to get all user borrows
 */
export function useUserBorrows() {
  const { isConnected } = useAccount();
  const allAssets = ConfigService.getAllAssets();

  const borrows = allAssets.map((asset) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: balance } = useBorrowBalance(asset.symbol, isConnected);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { price } = usePriceFromOracle(asset.symbol, isConnected);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: tokenDecimals } = useTokenDecimals(asset.symbol, isConnected);

    // Use contract decimals if available, otherwise fall back to config
    const decimals = tokenDecimals !== undefined ? tokenDecimals : asset.decimals;

    return {
      symbol: asset.symbol,
      asset: asset.symbol,
      assetName: asset.name,
      icon: asset.icon || "",
      balance: balance ? formatBalance(formatUnits(balance, decimals)) : "0.00",
      balanceRaw: balance || 0n,
      balanceUSD: price && balance 
        ? formatUSD(Number(formatUnits(balance, decimals)) * price) 
        : "$0.00",
      apy: formatAPY(asset.borrowAPY),
      price: price || 0,
      decimals: asset.decimals,
    };
  });

  const activeBorrows = useMemo(() => {
    return borrows.filter((borrow) => borrow.balanceRaw > 0n);
  }, [borrows]);

  const totalBalance = useMemo(() => {
    const total = activeBorrows.reduce((sum, borrow) => {
      return sum + (Number(formatUnits(borrow.balanceRaw, borrow.decimals)) * borrow.price);
    }, 0);
    return formatUSD(total);
  }, [activeBorrows]);

  const totalAPY = useMemo(() => {
    const totalValue = activeBorrows.reduce((sum, borrow) => {
      return sum + (Number(formatUnits(borrow.balanceRaw, borrow.decimals)) * borrow.price);
    }, 0);
    
    if (totalValue === 0) return "0.00%";
    
    const weightedAPY = activeBorrows.reduce((sum, borrow) => {
      const assetConfig = ConfigService.getAssetConfig(borrow.symbol);
      if (!assetConfig) return sum;
      const value = Number(formatUnits(borrow.balanceRaw, borrow.decimals)) * borrow.price;
      return sum + (assetConfig.borrowAPY * value);
    }, 0);
    
    return formatAPY(weightedAPY / totalValue);
  }, [activeBorrows]);

  return {
    borrows: activeBorrows,
    allBorrows: borrows,
    totalBalance,
    totalAPY,
  };
}

/**
 * Hook to get all wallet balances
 */
export function useWalletBalances(showZeroBalance: boolean = false) {
  const { isConnected } = useAccount();
  const allAssets = ConfigService.getAllAssets();

  const balances = allAssets.map((asset) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: balance } = useTokenBalance(asset.symbol, isConnected);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { price } = usePriceFromOracle(asset.symbol, isConnected);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: tokenDecimals } = useTokenDecimals(asset.symbol, isConnected);

    // Use contract decimals if available, otherwise fall back to config
    const decimals = tokenDecimals !== undefined ? tokenDecimals : asset.decimals;

    return {
      symbol: asset.symbol,
      asset: asset.symbol,
      assetName: asset.name,
      icon: asset.icon || "",
      walletBalance: balance ? formatBalance(formatUnits(balance, decimals)) : "0.00",
      balanceRaw: balance || 0n,
      apy: formatAPY(asset.supplyAPY),
      canBeCollateral: asset.canBeCollateral,
      price: price || 0,
      decimals: asset.decimals,
    };
  });

  const filteredBalances = useMemo(() => {
    if (showZeroBalance) {
      return balances;
    }
    return balances.filter((balance) => balance.balanceRaw > 0n);
  }, [balances, showZeroBalance]);

  return {
    balances: filteredBalances,
    allBalances: balances,
  };
}

/**
 * Hook to get available borrow amounts for all assets
 */
export function useAvailableBorrows() {
  const { isConnected } = useAccount();
  const allAssets = ConfigService.getAllAssets();

  const availableBorrows = allAssets.map((asset) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: available } = useAvailableBorrow(asset.symbol, isConnected);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { price } = usePriceFromOracle(asset.symbol, isConnected);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: tokenDecimals } = useTokenDecimals(asset.symbol, isConnected);

    // Use contract decimals if available, otherwise fall back to config
    const decimals = tokenDecimals !== undefined ? tokenDecimals : asset.decimals;

    return {
      symbol: asset.symbol,
      asset: asset.symbol,
      assetName: asset.name,
      icon: asset.icon || "",
      available: available ? formatBalance(formatUnits(available, decimals)) : "0.00",
      availableRaw: available || 0n,
      apy: formatAPY(asset.borrowAPY),
      price: price || 0,
      decimals: decimals,
    };
  });

  return availableBorrows;
}


/**
 * Utility functions for calculations (Net Worth, Net APY, Collateral, etc.)
 */

import { ConfigService } from "@/services/configService";

/**
 * Calculate total USD value of supplied assets
 */
export function calculateTotalSuppliedValue(
  supplies: Array<{ symbol: string; balance: number; price: number }>
): number {
  return supplies.reduce((total, supply) => {
    return total + supply.balance * supply.price;
  }, 0);
}

/**
 * Calculate total USD value of borrowed assets
 */
export function calculateTotalBorrowedValue(
  borrows: Array<{ symbol: string; balance: number; price: number }>
): number {
  return borrows.reduce((total, borrow) => {
    return total + borrow.balance * borrow.price;
  }, 0);
}

/**
 * Calculate Net Worth
 * Net Worth = Total Supplied Value - Total Borrowed Value
 */
export function calculateNetWorth(
  totalSuppliedValue: number,
  totalBorrowedValue: number
): number {
  return totalSuppliedValue - totalBorrowedValue;
}

/**
 * Calculate Net APY
 * Net APY = (Sum of Supply APY) - (Sum of Borrow APY)
 */
export function calculateNetAPY(
  supplies: Array<{ symbol: string; balance: number; apy: number }>,
  borrows: Array<{ symbol: string; balance: number; apy: number }>
): number {
  const supplyAPY = supplies.reduce((total, supply) => {
    const assetConfig = ConfigService.getAssetConfig(supply.symbol);
    if (!assetConfig) return total;
    return total + assetConfig.supplyAPY * (supply.balance || 0);
  }, 0);

  const borrowAPY = borrows.reduce((total, borrow) => {
    const assetConfig = ConfigService.getAssetConfig(borrow.symbol);
    if (!assetConfig) return total;
    return total + assetConfig.borrowAPY * (borrow.balance || 0);
  }, 0);

  return supplyAPY - borrowAPY;
}

/**
 * Calculate Collateral (borrowed against supplied assets)
 * Collateral = Total USD value of assets borrowed against supplied assets
 */
export function calculateCollateral(
  borrows: Array<{ symbol: string; balance: number; price: number }>
): number {
  return calculateTotalBorrowedValue(borrows);
}

/**
 * Calculate Borrow Power Used
 * Borrow Power Used = (Total Borrowed Value / Max Borrow Limit) × 100
 */
export function calculateBorrowPowerUsed(
  totalBorrowedValue: number,
  totalSuppliedValue: number
): number {
  if (totalSuppliedValue === 0) {
    return 0;
  }

  const maxBorrowLimit = totalSuppliedValue * 0.75; // 75% LTV
  if (maxBorrowLimit === 0) {
    return 0;
  }

  return (totalBorrowedValue / maxBorrowLimit) * 100;
}

/**
 * Calculate Utilization Rate
 * Utilization Rate = (Total Borrowed / Total Supplied) × 100
 */
export function calculateUtilizationRate(
  totalBorrowed: number,
  totalSupplied: number
): number {
  if (totalSupplied === 0) {
    return 0;
  }
  return (totalBorrowed / totalSupplied) * 100;
}

/**
 * Calculate available borrow amount for an asset
 * Available = (Total Supplied Value × LTV) - Total Borrowed Value
 */
export function calculateAvailableBorrow(
  totalSuppliedValue: number,
  totalBorrowedValue: number,
  assetPrice: number
): number {
  const maxBorrowValue = totalSuppliedValue * 0.75; // 75% LTV
  const availableBorrowValue = maxBorrowValue - totalBorrowedValue;
  
  if (availableBorrowValue <= 0 || assetPrice === 0) {
    return 0;
  }

  return availableBorrowValue / assetPrice;
}


/**
 * Utility functions for formatting numbers, balances, and values
 */

/**
 * Format balance to 2 decimal places
 */
export function formatBalance(balance: number | string, decimals: number = 2): string {
  const num = typeof balance === "string" ? parseFloat(balance) : balance;
  if (isNaN(num) || num === 0) {
    return "0.00";
  }
  return num.toFixed(decimals);
}

/**
 * Optimize large numbers (K, M, etc.)
 */
export function optimizeNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) {
    return "0";
  }

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(2);
}

/**
 * Format USD value
 */
export function formatUSD(value: number | string, showDecimals: boolean = true): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) {
    return "$0.00";
  }

  if (showDecimals) {
    return `$${num.toFixed(2)}`;
  }
  return `$${optimizeNumber(num)}`;
}

/**
 * Format APY percentage
 */
export function formatAPY(apy: number | string): string {
  const num = typeof apy === "string" ? parseFloat(apy) : apy;
  if (isNaN(num)) {
    return "0.00%";
  }

  if (num < 0.0001) {
    return "< 0.01%";
  }

  return `${(num * 100).toFixed(2)}%`;
}

/**
 * Format health factor
 */
export function formatHealthFactor(healthFactor: number | string): string {
  const num = typeof healthFactor === "string" ? parseFloat(healthFactor) : healthFactor;
  if (isNaN(num)) {
    return "∞";
  }

  if (num === Infinity || num > 1e18) {
    return "∞";
  }

  return num.toFixed(2);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number | string, decimals: number = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) {
    return "0.00%";
  }
  return `${(num * 100).toFixed(decimals)}%`;
}


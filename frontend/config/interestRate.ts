/**
 * Interest Rate Model Configuration
 * Kinked Interest Rate Model for ZenFinance
 */

/**
 * Interest Rate Model Parameters
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
 * Calculate borrow rate using kinked interest rate model
 * @param utilization - Utilization rate as decimal (0.75 = 75%)
 * @returns Borrow rate as decimal (0.12 = 12%)
 */
export function calculateBorrowRate(utilization: number): number {
  const { baseRate, slope1, slope2, optimalUtilization } = INTEREST_RATE_MODEL;
  
  if (utilization < optimalUtilization) {
    // Utilization below optimal: linear increase
    return baseRate + (utilization / optimalUtilization) * slope1;
  } else {
    // Utilization above optimal: kinked increase
    const excessUtilization = utilization - optimalUtilization;
    const maxExcess = 1 - optimalUtilization; // Maximum possible excess (100% - 75% = 25%)
    return baseRate + slope1 + (excessUtilization / maxExcess) * slope2;
  }
}

/**
 * Calculate supply APY from borrow rate
 * Supply APY = Borrow Rate × (1 - Reserve Factor) × Utilization
 * @param borrowRate - Borrow rate as decimal
 * @param utilization - Utilization rate as decimal
 * @param reserveFactor - Reserve factor as decimal (default 0.10 = 10%)
 * @returns Supply APY as decimal
 */
export function calculateSupplyAPY(
  borrowRate: number,
  utilization: number,
  reserveFactor: number = 0.10
): number {
  return borrowRate * (1 - reserveFactor) * utilization;
}

/**
 * Calculate APY with daily compounding
 * APY = (1 + r/n)^n - 1
 * @param annualRate - Annual interest rate as decimal
 * @param compoundingFrequency - Number of compounding periods per year (default 365 for daily)
 * @returns APY as decimal
 */
export function calculateAPY(
  annualRate: number,
  compoundingFrequency: number = APY_CONFIG.compoundingFrequency
): number {
  return Math.pow(1 + annualRate / compoundingFrequency, compoundingFrequency) - 1;
}

/**
 * Calculate utilization rate
 * Utilization Rate = (Total Borrowed / Total Supplied) × 100
 * @param totalBorrowed - Total borrowed amount
 * @param totalSupplied - Total supplied amount
 * @returns Utilization rate as decimal (0.75 = 75%)
 */
export function calculateUtilizationRate(
  totalBorrowed: number,
  totalSupplied: number
): number {
  if (totalSupplied === 0) {
    return 0;
  }
  return totalBorrowed / totalSupplied;
}

/**
 * Format interest rate as percentage string
 * @param rate - Interest rate as decimal
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted percentage string
 */
export function formatInterestRate(rate: number, decimals: number = 2): string {
  if (rate < 0.0001) {
    return "< 0.01%";
  }
  return `${(rate * 100).toFixed(decimals)}%`;
}

export type InterestRateModel = typeof INTEREST_RATE_MODEL;
export type APYConfig = typeof APY_CONFIG;


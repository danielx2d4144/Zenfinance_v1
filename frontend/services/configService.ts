/**
 * Configuration Service
 * Centralized access to all configuration files
 */

import { ZENCHAIN_CONFIG } from "@/config/network";
import { ASSET_CONFIG, getAssetConfig, getAllAssets, getAllAssetSymbols, formatAPY } from "@/config/assets";
import { 
  PAIR_CONFIG, 
  getPairConfig, 
  getUSDCPair, 
  getRoutingPathToUSDC, 
  hasDirectUSDCPair,
  USDC_ADDRESS 
} from "@/config/pairs";
import { 
  INTEREST_RATE_MODEL, 
  APY_CONFIG,
  calculateBorrowRate,
  calculateSupplyAPY,
  calculateAPY,
  calculateUtilizationRate,
  formatInterestRate
} from "@/config/interestRate";

/**
 * Configuration Service
 * Provides centralized access to all configuration
 */
export class ConfigService {
  /**
   * Get network configuration
   */
  static getNetworkConfig() {
    return ZENCHAIN_CONFIG;
  }

  /**
   * Get asset configuration by symbol
   */
  static getAssetConfig(symbol: string) {
    return getAssetConfig(symbol);
  }

  /**
   * Get all assets
   */
  static getAllAssets() {
    return getAllAssets();
  }

  /**
   * Get all asset symbols
   */
  static getAllAssetSymbols() {
    return getAllAssetSymbols();
  }

  /**
   * Get pair configuration
   */
  static getPairConfig(tokenA: string, tokenB: string) {
    return getPairConfig(tokenA, tokenB);
  }

  /**
   * Get USDC pair for a token
   */
  static getUSDCPair(tokenSymbol: string) {
    return getUSDCPair(tokenSymbol);
  }

  /**
   * Get routing path to USDC
   */
  static getRoutingPathToUSDC(tokenSymbol: string) {
    return getRoutingPathToUSDC(tokenSymbol);
  }

  /**
   * Check if token has direct USDC pair
   */
  static hasDirectUSDCPair(tokenSymbol: string) {
    return hasDirectUSDCPair(tokenSymbol);
  }

  /**
   * Get USDC address
   */
  static getUSDCAddress() {
    return USDC_ADDRESS;
  }

  /**
   * Get interest rate model configuration
   */
  static getInterestRateModel() {
    return INTEREST_RATE_MODEL;
  }

  /**
   * Get APY configuration
   */
  static getAPYConfig() {
    return APY_CONFIG;
  }

  /**
   * Calculate borrow rate
   */
  static calculateBorrowRate(utilization: number) {
    return calculateBorrowRate(utilization);
  }

  /**
   * Calculate supply APY
   */
  static calculateSupplyAPY(borrowRate: number, utilization: number, reserveFactor?: number) {
    return calculateSupplyAPY(borrowRate, utilization, reserveFactor);
  }

  /**
   * Calculate APY with compounding
   */
  static calculateAPY(annualRate: number, compoundingFrequency?: number) {
    return calculateAPY(annualRate, compoundingFrequency);
  }

  /**
   * Calculate utilization rate
   */
  static calculateUtilizationRate(totalBorrowed: number, totalSupplied: number) {
    return calculateUtilizationRate(totalBorrowed, totalSupplied);
  }

  /**
   * Format APY as percentage string
   */
  static formatAPY(apy: number, decimals?: number) {
    return formatAPY(apy, decimals);
  }

  /**
   * Format interest rate as percentage string
   */
  static formatInterestRate(rate: number, decimals?: number) {
    return formatInterestRate(rate, decimals);
  }
}

// Export all configs for direct access if needed
export {
  ZENCHAIN_CONFIG,
  ASSET_CONFIG,
  PAIR_CONFIG,
  INTEREST_RATE_MODEL,
  APY_CONFIG,
  USDC_ADDRESS,
};

// Export helper functions
export {
  getAssetConfig,
  getAllAssets,
  getAllAssetSymbols,
  formatAPY,
  getPairConfig,
  getUSDCPair,
  getRoutingPathToUSDC,
  hasDirectUSDCPair,
  calculateBorrowRate,
  calculateSupplyAPY,
  calculateAPY,
  calculateUtilizationRate,
  formatInterestRate,
};

